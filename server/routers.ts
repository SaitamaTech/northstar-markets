import { COOKIE_NAME } from "@shared/const";
import {
  categoryLabels,
  economicEvents,
  getChartSeries,
  instruments,
  marketOverview,
  newsItems,
} from "@shared/market-data";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { fetchLiveNews } from "./liveNews";
import { getDb } from "./db";
import { protectedProcedure } from "./_core/trpc";
import { getMarketPrice, getPortfolio } from "./portfolio";
import { getLiveInstrument, getLiveInstruments } from "./market-provider";
import { btcDeposits, walletBalances } from "../drizzle/schema";
import { getBitcoinNetwork, getRequiredConfirmations, bitcoinWalletProvider, syncBtcDeposits } from "./btc-provider";
import { eq } from "drizzle-orm";
import { supabaseAdmin } from "./_core/supabase";
import { validateWalletConnectionPayload } from "./_core/wallet";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  market: router({
    overview: publicProcedure.query(() => marketOverview),
    instruments: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(({ input }) => getLiveInstruments(input?.category)),
    instrument: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(({ input }) => getLiveInstrument(input.symbol)),
    chart: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const liveInstrument = await getLiveInstrument(input.symbol);
        if (!liveInstrument || liveInstrument.category !== "crypto") return getChartSeries(input.symbol);
        const labels = ["-12h", "-11h", "-10h", "-9h", "-8h", "-7h", "-6h", "-5h", "-4h", "-3h", "-2h", "-1h", "Now"];
        const series = liveInstrument.sparkline.slice(-labels.length);
        return series.map((value, index) => ({ label: labels[index] ?? "Now", value: Number(value.toFixed(2)) }));
      }),
    news: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        let stories = newsItems;
        try {
          const liveStories = await fetchLiveNews();
          if (liveStories.length > 0) stories = liveStories;
        } catch (error) {
          console.warn("Live news unavailable; using demo stories", error);
        }
        if (!input?.category || input.category === "all") return stories;
        return stories.filter((item) => item.category.toLowerCase() === input.category?.toLowerCase());
      }),
    events: publicProcedure.query(() => economicEvents),
    categories: publicProcedure.query(() => Object.entries(categoryLabels).map(([id, label]) => ({ id, label }))),
  }),
  portfolio: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        return {
          cashBalance: 0,
          btcBalanceSatoshis: 0,
          btcBalance: 0,
          positions: [],
          currentValue: 0,
          investedAmount: 0,
          profitLoss: 0,
          profitPercentage: 0,
          totalValue: 0,
          mode: "LIVE" as const,
        };
      }

      return { ...(await getPortfolio(db, ctx.user.openId)), mode: "LIVE" as const };
    }),
    quote: protectedProcedure.input(z.object({ symbol: z.string() })).query(async ({ input }) => ({ symbol: input.symbol.toUpperCase(), price: await getMarketPrice(input.symbol) })),
  }),
  wallet: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      if (!supabaseAdmin) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Supabase is not configured on the server." });
      }

      const { data, error } = await supabaseAdmin
        .from("wallet_connections")
        .select("id, user_id, wallet_address, network, wallet_provider, created_at, updated_at")
        .eq("user_id", ctx.user.openId)
        .maybeSingle();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return {
        connected: Boolean(data),
        walletAddress: data?.wallet_address ?? null,
        network: data?.network ?? null,
        walletProvider: data?.wallet_provider ?? null,
      };
    }),
    connect: protectedProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
        network: z.string().min(1),
        walletProvider: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!supabaseAdmin) {
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Supabase is not configured on the server." });
        }

        const payload = validateWalletConnectionPayload(input);

        const { data, error } = await supabaseAdmin
          .from("wallet_connections")
          .upsert({
            user_id: ctx.user.openId,
            wallet_address: payload.walletAddress,
            network: payload.network,
            wallet_provider: payload.walletProvider,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" })
          .select("wallet_address, network, wallet_provider")
          .single();

        if (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        }

        return {
          walletAddress: data.wallet_address,
          network: data.network,
          walletProvider: data.wallet_provider,
        };
      }),
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      if (!supabaseAdmin) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Supabase is not configured on the server." });
      }

      const { error } = await supabaseAdmin
        .from("wallet_connections")
        .delete()
        .eq("user_id", ctx.user.openId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
  }),
  btc: router({
    depositAddress: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database is not configured" });
      const assigned = await bitcoinWalletProvider.createDepositAddress(ctx.user.openId, db);
      return { ...assigned, requiredConfirmations: getRequiredConfirmations(), testnet: getBitcoinNetwork() === "testnet" };
    }),
    deposits: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try { await syncBtcDeposits(db, ctx.user.openId); } catch (error) { console.warn("[BTC] Deposit sync unavailable:", error); }
      const deposits = await db.select().from(btcDeposits).where(eq(btcDeposits.userId, ctx.user.openId));
      return deposits.map(deposit => ({ ...deposit, network: getBitcoinNetwork() }));
    }),
    balance: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { satoshis: 0, btc: 0 };
      try { await syncBtcDeposits(db, ctx.user.openId); } catch (error) { console.warn("[BTC] Balance sync unavailable:", error); }
      const result = await db.select().from(walletBalances).where(eq(walletBalances.userId, ctx.user.openId)).limit(1);
      const satoshis = Number(result[0]?.btcBalanceSatoshis ?? 0);
      return { satoshis, btc: satoshis / 100_000_000 };
    }),
  }),
});

export type AppRouter = typeof appRouter;
