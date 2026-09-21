export function calculateDailyInterest(balance: number, annualRate: number) {
  const safeBalance = Number.isFinite(balance) ? Math.max(balance, 0) : 0;
  const safeAnnualRate = Number.isFinite(annualRate) ? Math.max(annualRate, 0) : 0;

  return (safeBalance * safeAnnualRate) / 365;
}

export function formatSavingsSummary(balance: number, annualRate: number) {
  const dailyInterest = calculateDailyInterest(balance, annualRate);
  return `Your crypto savings balance earns about $${dailyInterest.toFixed(2)} in daily interest on a $${Number(balance).toFixed(2)} deposit at ${annualRate * 100}% APR, and the yield is added automatically every day in ETH.`;
}
