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
import { adminProcedure, protectedProcedure } from "./_core/trpc";
import { fetchLiveNews } from "./liveNews";
import { getDb } from "./db";
import { getMarketPrice, getPortfolio } from "./portfolio";
import { getLiveInstrument, getLiveInstruments } from "./market-provider";
import { btcDeposits, investmentAccruals, investmentPlans, investments, walletBalances, wallets } from "../drizzle/schema";
import { getBitcoinNetwork, getRequiredConfirmations, bitcoinWalletProvider, syncBtcDeposits } from "./btc-provider";
import { and, desc, eq } from "drizzle-orm";
import { supabaseAdmin } from "./_core/supabase";
import { validateWalletConnectionPayload } from "./_core/wallet";
import {
  addDecimal,
  decimalNumber,
  ensureInvestmentPlans,
  getInvestmentSummaryForUser,
  getPlanDailyInterest,
  getWalletStateForUser,
  processDailyAccruals,
  subtractDecimal,
  validateInvestmentPlan,
} from "./investments";

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
  investments: router({
    plans: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const plans = await ensureInvestmentPlans(db);
      return plans.map((plan: any) => ({
        ...plan,
        minimumInvestment: Number(plan.minimumInvestment),
        dailyRate: Number(plan.dailyRate),
        estimatedDailyEarnings: Number(plan.minimumInvestment) * Number(plan.dailyRate),
      }));
    }),
    summary: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        return { availableBalance: "0", investedBalance: "0", totalEarned: "0", currentValue: "0", activeInvestments: 0, investments: [] };
      }

      const summary = await getInvestmentSummaryForUser(db, ctx.user.openId);
      return summary;
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      await ensureInvestmentPlans(db);

      const rows = await db.select().from(investments).where(eq(investments.userId, ctx.user.openId)).orderBy(desc(investments.createdAt));
      const plans = await db.select().from(investmentPlans);
      const planMap = new Map(plans.map((plan) => [plan.id, plan]));

      return rows.map((investment) => ({
        ...investment,
        plan: planMap.get(investment.planId) ?? null,
        principalAmount: Number(investment.principalAmount),
        accruedInterest: Number(investment.accruedInterest),
        totalValue: Number(investment.totalValue),
        dailyInterestAmount: Number(investment.dailyInterestAmount),
      }));
    }),
    detail: protectedProcedure.input(z.object({ investmentId: z.number() })).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database is not configured" });

      const [investment] = await db.select().from(investments).where(and(eq(investments.id, input.investmentId), eq(investments.userId, ctx.user.openId))).limit(1);
      if (!investment) throw new TRPCError({ code: "NOT_FOUND", message: "Investment not found." });

      const [plan] = await db.select().from(investmentPlans).where(eq(investmentPlans.id, investment.planId)).limit(1);
      const history = await db.select().from(investmentAccruals).where(and(eq(investmentAccruals.investmentId, investment.id), eq(investmentAccruals.userId, ctx.user.openId))).orderBy(desc(investmentAccruals.createdAt));

      return {
        ...investment,
        plan: plan ?? null,
        principalAmount: Number(investment.principalAmount),
        accruedInterest: Number(investment.accruedInterest),
        totalValue: Number(investment.totalValue),
        dailyInterestAmount: Number(investment.dailyInterestAmount),
        history: history.map((entry) => ({
          ...entry,
          amount: Number(entry.amount),
          balanceAfter: Number(entry.balanceAfter),
        })),
      };
    }),
    history: protectedProcedure.input(z.object({ investmentId: z.number().optional(), limit: z.number().default(25) })).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const whereClauses = input.investmentId !== undefined
        ? and(eq(investmentAccruals.investmentId, input.investmentId), eq(investmentAccruals.userId, ctx.user.openId))
        : eq(investmentAccruals.userId, ctx.user.openId);

      const rows = await db.select().from(investmentAccruals).where(whereClauses).orderBy(desc(investmentAccruals.createdAt)).limit(input.limit);
      return rows.map((entry) => ({
        ...entry,
        amount: Number(entry.amount),
        balanceAfter: Number(entry.balanceAfter),
      }));
    }),
    create: protectedProcedure.input(z.object({
      planId: z.number(),
      amount: z.union([z.string(), z.number()]),
      asset: z.string().min(3).max(16),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database is not configured" });

      const walletState = await getWalletStateForUser(db, ctx.user.openId);
      const planList = await ensureInvestmentPlans(db);
      const plan = planList.find((entry: any) => entry.id === input.planId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Investment plan not found." });

      const amountAsNumber = Number(input.amount);
      validateInvestmentPlan(plan, amountAsNumber);
      if (Number(walletState.availableBalance) < amountAsNumber) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient available balance to complete this investment." });
      }

      const startDate = new Date();
      const maturityDate = new Date(startDate);
      maturityDate.setDate(maturityDate.getDate() + Number(plan.durationDays));
      const nextAccrualDate = new Date(startDate);
      nextAccrualDate.setDate(nextAccrualDate.getDate() + 1);
      const amountString = String(input.amount);
      const dailyInterest = getPlanDailyInterest(amountString, plan.dailyRate);

      await db.transaction(async (tx: any) => {
        const wallet = (await tx.select().from(wallets).where(eq(wallets.userId, ctx.user.openId)).limit(1))[0];
        if (!wallet) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Wallet not found for this account." });
        }

        const reducedBalance = subtractDecimal(wallet.cashBalance, amountString);
        await tx.update(wallets).set({ cashBalance: reducedBalance, updatedAt: new Date() }).where(eq(wallets.userId, ctx.user.openId));

        await tx.insert(investments).values({
          userId: ctx.user.openId,
          asset: input.asset.toUpperCase(),
          principalAmount: amountString,
          planId: plan.id,
          interestRate: plan.dailyRate,
          interestFrequency: "daily",
          dailyInterestAmount: dailyInterest,
          accruedInterest: "0",
          totalValue: amountString,
          startDate,
          maturityDate,
          lastAccrualDate: null,
          nextAccrualDate,
          status: "ACTIVE",
        });

        const [createdInvestment] = await tx.select().from(investments).where(eq(investments.userId, ctx.user.openId)).orderBy(desc(investments.createdAt)).limit(1);
        if (!createdInvestment) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Investment creation failed." });
        }

        await tx.insert(investmentAccruals).values({
          investmentId: createdInvestment.id,
          userId: ctx.user.openId,
          asset: input.asset.toUpperCase(),
          transactionType: "INVESTMENT_CREATED",
          amount: amountString,
          balanceAfter: amountString,
          accrualDate: startDate,
          description: `Investment created for ${input.asset.toUpperCase()} using ${plan.name}`,
        });
      });

      const summary = await getInvestmentSummaryForUser(db, ctx.user.openId);
      return {
        success: true,
        message: "Investment created successfully.",
        dailyInterest,
        summary,
      };
    }),
    withdraw: protectedProcedure.input(z.object({
      investmentId: z.number(),
      amount: z.union([z.string(), z.number()]).optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database is not configured" });

      const [investment] = await db.select().from(investments)
        .where(and(eq(investments.id, input.investmentId), eq(investments.userId, ctx.user.openId)))
        .limit(1);

      if (!investment) throw new TRPCError({ code: "NOT_FOUND", message: "Investment not found." });
      if (investment.status !== "ACTIVE") throw new TRPCError({ code: "BAD_REQUEST", message: "Only active investments can be withdrawn." });

      const totalValue = Number(investment.totalValue ?? 0);
      const requestedAmount = Number(input.amount ?? totalValue);
      if (requestedAmount <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Withdrawal amount must be greater than zero." });
      if (requestedAmount !== totalValue) throw new TRPCError({ code: "BAD_REQUEST", message: "This withdrawal flow is configured for full-value exits only." });

      await db.transaction(async (tx: any) => {
        const wallet = (await tx.select().from(wallets).where(eq(wallets.userId, ctx.user.openId)).limit(1))[0];
        if (!wallet) throw new TRPCError({ code: "BAD_REQUEST", message: "Wallet not found for this account." });

        const updatedCash = addDecimal(wallet.cashBalance, String(requestedAmount));
        await tx.update(wallets).set({ cashBalance: updatedCash, updatedAt: new Date() }).where(eq(wallets.userId, ctx.user.openId));
        await tx.update(investments).set({
          totalValue: "0",
          accruedInterest: "0",
          principalAmount: "0",
          status: "COMPLETED",
          updatedAt: new Date(),
          maturityDate: new Date(),
        }).where(eq(investments.id, investment.id));

        await tx.insert(investmentAccruals).values({
          investmentId: investment.id,
          userId: ctx.user.openId,
          asset: investment.asset,
          transactionType: "INVESTMENT_WITHDRAWAL",
          amount: String(requestedAmount),
          balanceAfter: updatedCash,
          accrualDate: new Date(),
          description: `Full withdrawal of ${investment.asset} investment`,
        });
      });

      const summary = await getInvestmentSummaryForUser(db, ctx.user.openId);
      return {
        success: true,
        message: "Investment withdrawn successfully and returned to your available balance.",
        summary,
      };
    }),
    processAccruals: adminProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database is not configured" });
      return processDailyAccruals(db);
    }),
  }),
  admin: router({
    plans: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(investmentPlans).orderBy(desc(investmentPlans.createdAt));
    }),
    createPlan: adminProcedure.input(z.object({
      name: z.string().min(2),
      asset: z.string().min(3).max(16),
      minimumInvestment: z.union([z.string(), z.number()]),
      durationDays: z.number().int().positive(),
      dailyRate: z.union([z.string(), z.number()]),
      isActive: z.boolean().optional(),
      description: z.string().optional(),
      riskNote: z.string().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database is not configured" });

      await db.insert(investmentPlans).values({
        name: input.name,
        asset: input.asset.toUpperCase(),
        minimumInvestment: String(input.minimumInvestment),
        durationDays: input.durationDays,
        dailyRate: String(input.dailyRate),
        isActive: input.isActive === false ? 0 : 1,
        description: input.description ?? null,
        riskNote: input.riskNote ?? null,
      });

      const rows = await db.select().from(investmentPlans).orderBy(desc(investmentPlans.createdAt)).limit(1);
      return rows[0];
    }),
    updatePlan: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      asset: z.string().optional(),
      minimumInvestment: z.union([z.string(), z.number()]).optional(),
      durationDays: z.number().int().positive().optional(),
      dailyRate: z.union([z.string(), z.number()]).optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database is not configured" });

      const updates: Record<string, any> = {};
      if (input.name) updates.name = input.name;
      if (input.asset) updates.asset = input.asset.toUpperCase();
      if (input.minimumInvestment !== undefined) updates.minimumInvestment = String(input.minimumInvestment);
      if (input.durationDays !== undefined) updates.durationDays = input.durationDays;
      if (input.dailyRate !== undefined) updates.dailyRate = String(input.dailyRate);
      if (input.isActive !== undefined) updates.isActive = input.isActive ? 1 : 0;

      await db.update(investmentPlans).set(updates).where(eq(investmentPlans.id, input.id));
      const [updated] = await db.select().from(investmentPlans).where(eq(investmentPlans.id, input.id)).limit(1);
      return updated;
    }),
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
