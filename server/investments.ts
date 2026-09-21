import { TRPCError } from "@trpc/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { investmentAccruals, investmentPlans, investments, wallets } from "../drizzle/schema";

export const defaultInvestmentPlans = [
  { name: "Starter", asset: "USDT", minimumInvestment: "100", durationDays: 30, dailyRate: "0.0012", description: "A balanced plan for new investors seeking steady daily accruals.", riskNote: "Returns are estimated and subject to the platform terms, market conditions, and product risks." },
  { name: "Growth", asset: "USDT", minimumInvestment: "500", durationDays: 60, dailyRate: "0.0018", description: "Designed for longer compounding with higher daily accrual potential.", riskNote: "All returns are estimates and may vary based on product conditions and risk factors." },
  { name: "Premium", asset: "USDT", minimumInvestment: "2000", durationDays: 90, dailyRate: "0.0024", description: "A premium plan for larger positions with a longer maturity window.", riskNote: "Investment performance is not guaranteed and is subject to the current agreement terms." },
] as const;

export function decimalNumber(value: string | number | null | undefined, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : Number(fallback);
}

export function decimalString(value: string | number | null | undefined, fallback = "0") {
  const parsed = decimalNumber(value, Number(fallback));
  return parsed.toFixed(8);
}

export function addDecimal(a: string | number | null | undefined, b: string | number | null | undefined) {
  return (decimalNumber(a) + decimalNumber(b)).toFixed(8);
}

export function subtractDecimal(a: string | number | null | undefined, b: string | number | null | undefined) {
  return (decimalNumber(a) - decimalNumber(b)).toFixed(8);
}

export function multiplyDecimal(a: string | number | null | undefined, b: string | number | null | undefined) {
  return (decimalNumber(a) * decimalNumber(b)).toFixed(8);
}

export function toUtcDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getPlanDailyInterest(principal: string | number, dailyRate: string | number) {
  return multiplyDecimal(principal, dailyRate);
}

export async function ensureInvestmentPlans(db: any) {
  const existing = await db.select().from(investmentPlans).limit(10);
  if (existing.length > 0) return existing;

  await db.insert(investmentPlans).values(defaultInvestmentPlans.map((plan) => ({
    name: plan.name,
    asset: plan.asset,
    minimumInvestment: plan.minimumInvestment,
    durationDays: plan.durationDays,
    dailyRate: plan.dailyRate,
    description: plan.description,
    riskNote: plan.riskNote,
    isActive: 1,
  })));

  return await db.select().from(investmentPlans).limit(10);
}

export async function getWalletStateForUser(db: any, userId: string) {
  const wallet = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  const currentBalance = wallet[0]?.cashBalance ?? "0";
  return { wallet: wallet[0] ?? null, availableBalance: String(currentBalance) };
}

export async function getInvestmentSummaryForUser(db: any, userId: string) {
  const walletState = await getWalletStateForUser(db, userId);
  const rows = await db.select().from(investments).where(eq(investments.userId, userId));

  const totalInvested = rows.reduce((sum: number, item: any) => sum + decimalNumber(item.principalAmount), 0);
  const totalEarned = rows.reduce((sum: number, item: any) => sum + decimalNumber(item.accruedInterest), 0);
  const activeInvestments = rows.filter((item: any) => item.status === "ACTIVE");
  const currentValue = rows.reduce((sum: number, item: any) => sum + decimalNumber(item.totalValue), 0);

  return {
    availableBalance: walletState.availableBalance,
    investedBalance: totalInvested.toFixed(8),
    totalEarned: totalEarned.toFixed(8),
    currentValue: currentValue.toFixed(8),
    activeInvestments: activeInvestments.length,
    investments: rows,
  };
}

export async function processDailyAccruals(db: any) {
  const activeInvestments = await db.select().from(investments).where(eq(investments.status, "ACTIVE"));
  const results: Array<{ investmentId: number; amount: string; accrualDate: Date }> = [];

  for (const investment of activeInvestments) {
    const dueDate = investment.nextAccrualDate ? new Date(investment.nextAccrualDate) : null;
    const now = new Date();
    if (!dueDate || dueDate > now) continue;

    const accrualDate = toUtcDate(new Date());
    const existing = await db.select().from(investmentAccruals).where(and(
      eq(investmentAccruals.investmentId, investment.id),
      eq(sql`DATE(${investmentAccruals.accrualDate})`, sql`DATE(${accrualDate.toISOString()})`)
    )).limit(1);

    if (existing.length > 0) continue;

    const dailyAmount = getPlanDailyInterest(investment.principalAmount, investment.interestRate);
    const newAccrued = addDecimal(investment.accruedInterest, dailyAmount);
    const newTotalValue = addDecimal(investment.principalAmount, newAccrued);
    const nextAccrual = new Date(now);
    nextAccrual.setDate(nextAccrual.getDate() + 1);

    await db.transaction(async (tx: any) => {
      await tx.update(investments)
        .set({
          accruedInterest: newAccrued,
          totalValue: newTotalValue,
          lastAccrualDate: now,
          nextAccrualDate: nextAccrual,
          updatedAt: new Date(),
        })
        .where(eq(investments.id, investment.id));

      await tx.insert(investmentAccruals).values({
        investmentId: investment.id,
        userId: investment.userId,
        asset: investment.asset,
        transactionType: "DAILY_INTEREST",
        amount: dailyAmount,
        balanceAfter: newTotalValue,
        accrualDate,
        description: "Daily investment return",
      });
    });

    results.push({ investmentId: investment.id, amount: dailyAmount, accrualDate });
  }

  return { processed: results.length, results };
}

export function validateInvestmentPlan(plan: any, amount: number) {
  if (!plan || plan.isActive !== 1) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Investment plan is unavailable." });
  }

  if (amount < Number(plan.minimumInvestment)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum investment for ${plan.name} is $${Number(plan.minimumInvestment).toLocaleString()}.` });
  }

  if (amount <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Investment amount must be greater than zero." });
  }
}
