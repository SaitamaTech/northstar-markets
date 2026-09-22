import { describe, expect, it } from "vitest";
import { moreMenuItems } from "../client/src/components/AppShell";

describe("AppShell more menu", () => {
  it("keeps the same overflow destinations available in both desktop and mobile layouts", () => {
    const labels = moreMenuItems.map((item) => item.label);

    expect(labels).toContain("Watchlists");
    expect(labels).toContain("Portfolio");
    expect(labels).toContain("My investments");
    expect(moreMenuItems.some((item) => item.href === "/watchlist")).toBe(true);
  });
});
