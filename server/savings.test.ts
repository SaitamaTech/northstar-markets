import { describe, expect, it } from "vitest";
import { calculateDailyInterest, formatSavingsSummary } from "../shared/savings";

describe("crypto savings yield", () => {
  it("adds a daily yield to a deposit balance", () => {
    const balance = 1000;
    const rate = 0.12;
    const dailyInterest = calculateDailyInterest(balance, rate);

    expect(dailyInterest).toBeCloseTo(0.3287671232876712, 10);
  });

  it("describes the daily accrual in user-facing copy", () => {
    const summary = formatSavingsSummary(2500, 0.12);

    expect(summary).toContain("daily");
    expect(summary).toContain("0.82");
    expect(summary).toContain("ETH");
  });
});
