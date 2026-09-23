import { describe, expect, it } from "vitest";
import { isAdminUserForAccess } from "./_core/trpc";
import { getAdjustedWalletBalance, normalizeUserRole } from "./investments";

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
});
