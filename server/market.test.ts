import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("market procedures", () => {
  it("returns a populated global overview", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.market.overview();

    expect(result.length).toBeGreaterThanOrEqual(5);
    expect(result.some((item) => item.symbol === "SPX")).toBe(true);
  });

  it("filters instruments through the provider boundary", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.market.instruments({ category: "crypto" });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.category === "crypto")).toBe(true);
    expect(result.some((item) => item.symbol === "BTC")).toBe(true);
  });

  it("returns a normalized chart series for a requested symbol", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.market.chart({ symbol: "NVDA" });

    expect(result).toHaveLength(13);
    expect(result.at(-1)?.label).toBe("Now");
    expect(result.at(-1)?.value).toBeCloseTo(118.67, 2);
  });
});
