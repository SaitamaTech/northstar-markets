export type InvestmentProjection = {
  principal: number;
  dailyRate: number;
  dailyReturn: number;
  totalReturn: number;
  endValue: number;
  periods: Array<{
    label: string;
    days: number;
    totalReturn: number;
    endValue: number;
  }>;
};

export function calculateInvestmentProjection({
  principal,
  dailyRate,
  durationDays,
  fallbackRate,
}: {
  principal: number;
  dailyRate: number;
  durationDays?: number;
  fallbackRate?: number;
}): InvestmentProjection {
  const safePrincipal = Number.isFinite(principal) ? Math.max(principal, 0) : 0;
  const derivedRate = Number.isFinite(dailyRate) && dailyRate > 0 ? dailyRate : fallbackRate ?? 0.0015;
  const safeDailyRate = Number.isFinite(derivedRate) ? Math.max(derivedRate, 0) : 0;
  const safeDurationDays = Number.isFinite(durationDays) ? Math.max(durationDays ?? 0, 0) : 0;

  const dailyReturn = safePrincipal * safeDailyRate;
  const projectionDays = safeDurationDays > 0 ? safeDurationDays : 365;

  const periods = [7, 30, 365].map((days) => ({
    label: days === 7 ? "1 week" : days === 30 ? "1 month" : "1 year",
    days,
    totalReturn: dailyReturn * days,
    endValue: safePrincipal + dailyReturn * days,
  }));

  return {
    principal: safePrincipal,
    dailyRate: safeDailyRate,
    dailyReturn,
    totalReturn: dailyReturn * projectionDays,
    endValue: safePrincipal + dailyReturn * projectionDays,
    periods,
  };
}
