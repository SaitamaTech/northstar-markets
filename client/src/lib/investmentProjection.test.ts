import { describe, expect, it } from "vitest";
import { calculateInvestmentProjection } from "./investmentProjection";

describe("calculateInvestmentProjection", () => {
  it("projects weekly, monthly, and yearly gains from the entered principal", () => {
    const projection = calculateInvestmentProjection({ principal: 1000, dailyRate: 0.0015 });

    expect(projection.dailyReturn).toBe(1.5);
    expect(projection.periods[0]).toMatchObject({
      label: "1 week",
      days: 7,
      totalReturn: 10.5,
      endValue: 1010.5,
    });
    expect(projection.periods[1]).toMatchObject({
      label: "1 month",
      days: 30,
      totalReturn: 45,
      endValue: 1045,
    });
    expect(projection.periods[2]).toMatchObject({
      label: "1 year",
      days: 365,
      totalReturn: 547.5,
      endValue: 1547.5,
    });
  });

  it("uses a preview fallback rate when no real investment yield is available", () => {
    const projection = calculateInvestmentProjection({ principal: 1000, dailyRate: 0, fallbackRate: 0.0015, durationDays: 30 });

    expect(projection.dailyRate).toBe(0.0015);
    expect(projection.endValue).toBe(1045);
  });
});
