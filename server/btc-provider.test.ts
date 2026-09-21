import { describe, expect, it } from "vitest";
import { bitcoinWalletProvider, getDepositStatus } from "./btc-provider";

describe("Bitcoin deposit provider", () => {
  it("counts only outputs sent to the assigned address in satoshis", () => {
    const amount = bitcoinWalletProvider.validateTransaction({
      txid: "tx-1",
      status: { confirmed: false },
      vout: [
        { value: 12_345, scriptpubkey_address: "tb1qassigned" },
        { value: 99_999, scriptpubkey_address: "tb1qother" },
        { value: 5_000, scriptpubkey_address: "tb1qassigned" },
      ],
    }, "tb1qassigned");
    expect(amount).toBe(17_345);
  });

  it("moves deposits through detected, confirming, and confirmed states", () => {
    expect(getDepositStatus(0, 3)).toBe("detected");
    expect(getDepositStatus(2, 3)).toBe("confirming");
    expect(getDepositStatus(3, 3)).toBe("confirmed");
  });

  it("requires the configured confirmation threshold before crediting", () => {
    expect(getDepositStatus(5, 6)).toBe("confirming");
    expect(getDepositStatus(6, 6)).toBe("confirmed");
  });
});