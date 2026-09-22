import { describe, expect, it } from "vitest";
import { resolveReceiveWalletAddress } from "./walletAddress";

describe("resolveReceiveWalletAddress", () => {
  it("prefers the configured owner wallet address over the connected user wallet", () => {
    expect(
      resolveReceiveWalletAddress({
        connectedWalletAddress: "0xuserwallet123",
        configuredWalletAddress: "0xownerwallet456",
      }),
    ).toBe("0xownerwallet456");
  });

  it("falls back to the connected wallet when no owner wallet is configured", () => {
    expect(
      resolveReceiveWalletAddress({
        connectedWalletAddress: "0xuserwallet123",
        configuredWalletAddress: "",
      }),
    ).toBe("0xuserwallet123");
  });
});
