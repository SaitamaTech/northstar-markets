import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { notifyOwner } from "./notification";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { investmentAccruals, investments } from "../../drizzle/schema";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifications: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db.select().from(investmentAccruals)
      .where(eq(investmentAccruals.userId, ctx.user.openId))
      .orderBy(desc(investmentAccruals.createdAt))
      .limit(6);

    if (!rows.length) {
      const activeInvestments = await db.select().from(investments)
        .where(eq(investments.userId, ctx.user.openId))
        .orderBy(desc(investments.createdAt))
        .limit(3);

      return activeInvestments.map((investment) => ({
        id: `investment-${investment.id}`,
        title: `Investment active: ${investment.asset}`,
        detail: `${investment.status} plan • Daily earnings $${Number(investment.dailyInterestAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        time: new Date(investment.updatedAt ?? investment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        tone: "positive" as const,
        read: false,
      }));
    }

    return rows.map((row) => ({
      id: `accrual-${row.id}`,
      title: row.transactionType === "DAILY_INTEREST" ? "Daily return credited" : "Investment update",
      detail: `${row.asset} • ${row.description} • $${Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      time: new Date(row.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
      tone: "positive" as const,
      read: false,
    }));
  }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
