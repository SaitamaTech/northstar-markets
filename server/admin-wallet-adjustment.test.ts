import { describe, expect, it } from "vitest";
import { isAdminUserForAccess } from "./_core/trpc";
import { getAdjustedWalletBalance, normalizeUserRole } from "./investments";
import { mergeAdminUserRows } from "./routers";

describe("admin wallet adjustments", () => {
  it("adds a credit to the existing wallet balance", () => {
    expect(getAdjustedWalletBalance("100.50", "25.25", "credit")).toBe("125.75000000");
  });

  it("subtracts a debit from the existing wallet balance", () => {
    expect(getAdjustedWalletBalance("100.50", "25.25", "debit")).toBe("75.25000000");
  });

  it("applies an absolute set value", () => {
    expect(getAdjustedWalletBalance("100.50", "500", "set")).toBe("500.00000000");
  });

  it("normalizes supported user roles", () => {
    expect(normalizeUserRole("admin")).toBe("admin");
    expect(normalizeUserRole("USER")).toBe("user");
    expect(normalizeUserRole("manager")).toBe("user");
  });

  it("allows the configured admin gmail address to access the admin dashboard", () => {
    expect(isAdminUserForAccess({ role: "user", email: "israellawal323@gmail.com" })).toBe(true);
    expect(isAdminUserForAccess({ role: "user", email: "someoneelse@gmail.com" })).toBe(false);
  });

  it("merges Supabase auth users into the admin list when local DB rows are empty", () => {
    const dbUsers: Array<Record<string, any>> = [];
    const authUsers = [
      { id: "supabase-user-1", email: "investor@example.com", user_metadata: { full_name: "Investor One" } },
      { id: "supabase-user-2", email: "admin@example.com", user_metadata: { display_name: "Admin Two" } },
    ];

    const merged = mergeAdminUserRows(dbUsers, authUsers, { "supabase-user-1": "250.00", "supabase-user-2": "999.99" });

    expect(merged).toHaveLength(2);
    expect(merged.map((user) => user.openId)).toEqual(["supabase-user-1", "supabase-user-2"]);
    expect(merged[0].name).toBe("Investor One");
    expect(merged[0].cashBalance).toBe("250.00");
    expect(merged[1].role).toBe("user");
  });
});
