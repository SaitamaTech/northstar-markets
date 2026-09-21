import { describe, expect, it } from "vitest";
import { normalizeWalletAddress, validateWalletConnectionPayload } from "./_core/wallet";

describe("wallet connection validation", () => {
  it("normalizes an EVM wallet address to a canonical lowercase form", () => {
    expect(normalizeWalletAddress("0xAbCDEF1234567890ABCDEF1234567890ABCDEF12")).toBe("0xabcdef1234567890abcdef1234567890abcdef12");
  });

  it("rejects invalid wallet payloads and missing data", () => {
    expect(() => validateWalletConnectionPayload({ walletAddress: "", network: "eip155:1", walletProvider: "trust" })).toThrow(/wallet address/i);
    expect(() => validateWalletConnectionPayload({ walletAddress: "0x123", network: "eip155:1", walletProvider: "trust" })).toThrow(/valid wallet address/i);
    expect(() => validateWalletConnectionPayload({ walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12", network: "", walletProvider: "trust" })).toThrow(/network/i);
  });
});
