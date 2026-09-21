import { btcDepositAddresses, btcDeposits, ledgerTransactions, walletBalances } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

type Network = "testnet" | "mainnet";
type ChainTransaction = {
  txid: string;
  status: { confirmed: boolean; block_height?: number };
  vout: Array<{ value: number; scriptpubkey_address?: string }>;
};

export interface BitcoinWalletProvider {
  createDepositAddress(userId: string, db: any): Promise<{ address: string; network: Network }>;
  getAddressTransactions(address: string): Promise<ChainTransaction[]>;
  getConfirmations(transaction: ChainTransaction): Promise<number>;
  validateTransaction(transaction: ChainTransaction, address: string): number;
}

export function getBitcoinNetwork(): Network {
  return process.env.BTC_NETWORK === "testnet" ? "testnet" : "mainnet";
}

export function getRequiredConfirmations() {
  const value = Number(process.env.BTC_REQUIRED_CONFIRMATIONS ?? 3);
  return Number.isInteger(value) && value > 0 && value <= 100 ? value : 3;
}

export function getDepositStatus(confirmations: number, requiredConfirmations = getRequiredConfirmations()) {
  if (confirmations >= requiredConfirmations) return "confirmed" as const;
  if (confirmations > 0) return "confirming" as const;
  return "detected" as const;
}

class BlockstreamBitcoinProvider implements BitcoinWalletProvider {
  private readonly network = getBitcoinNetwork();
  private readonly baseUrl = this.network === "mainnet" ? "https://blockstream.info/api" : "https://blockstream.info/testnet/api";

  async createDepositAddress(userId: string, db: any) {
    const existing = await db.select().from(btcDepositAddresses).where(and(eq(btcDepositAddresses.userId, userId), eq(btcDepositAddresses.network, this.network), eq(btcDepositAddresses.isActive, 1))).limit(1);
    if (existing[0]) return { address: existing[0].address, network: this.network };

    const pool = (process.env.BTC_DEPOSIT_ADDRESS_POOL ?? "").split(",").map(value => value.trim()).filter(Boolean);
    if (!pool.length) throw new Error("BTC_DEPOSIT_ADDRESS_POOL is not configured");
    const assigned = await db.select({ address: btcDepositAddresses.address }).from(btcDepositAddresses);
    const used = new Set(assigned.map((row: { address: string }) => row.address));
    const address = pool.find(candidate => !used.has(candidate));
    if (!address) throw new Error("No unused BTC deposit address is available");
    await db.insert(btcDepositAddresses).values({ userId, address, network: this.network, label: `Northstar ${userId.slice(0, 8)}` });
    return { address, network: this.network };
  }

  async getAddressTransactions(address: string) {
    const response = await fetch(`${this.baseUrl}/address/${encodeURIComponent(address)}/txs`, { signal: AbortSignal.timeout(8_000), headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Bitcoin provider returned ${response.status}`);
    return await response.json() as ChainTransaction[];
  }

  async getConfirmations(transaction: ChainTransaction) {
    if (!transaction.status.confirmed || !transaction.status.block_height) return 0;
    const response = await fetch(`${this.baseUrl}/blocks/tip/height`, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`Bitcoin provider returned ${response.status}`);
    const tipHeight = Number(await response.text());
    return Math.max(0, tipHeight - transaction.status.block_height + 1);
  }

  validateTransaction(transaction: ChainTransaction, address: string) {
    return transaction.vout.filter(output => output.scriptpubkey_address === address).reduce((total, output) => total + output.value, 0);
  }
}

export const bitcoinWalletProvider: BitcoinWalletProvider = new BlockstreamBitcoinProvider();

export async function syncBtcDeposits(db: any, userId?: string) {
  const addressRows = await db.select().from(btcDepositAddresses).where(userId ? eq(btcDepositAddresses.userId, userId) : eq(btcDepositAddresses.isActive, 1));
  const requiredConfirmations = getRequiredConfirmations();
  const synced: unknown[] = [];
  for (const addressRow of addressRows) {
    const chainTransactions = await bitcoinWalletProvider.getAddressTransactions(addressRow.address);
    for (const chainTransaction of chainTransactions) {
      const amountSatoshis = bitcoinWalletProvider.validateTransaction(chainTransaction, addressRow.address);
      if (amountSatoshis <= 0) continue;
      const confirmations = await bitcoinWalletProvider.getConfirmations(chainTransaction);
      const existing = await db.select().from(btcDeposits).where(eq(btcDeposits.transactionHash, chainTransaction.txid)).limit(1);
      const status = getDepositStatus(confirmations, requiredConfirmations);
      const price = await getBtcUsdPrice();
      if (!existing[0]) {
        await db.insert(btcDeposits).values({ userId: addressRow.userId, depositAddressId: addressRow.id, depositAddress: addressRow.address, transactionHash: chainTransaction.txid, amountSatoshis, btcPriceAtDeposit: price.toFixed(8), usdValueAtDeposit: (amountSatoshis / 100_000_000 * price).toFixed(8), confirmations, requiredConfirmations, status, detectedAt: new Date(), confirmedAt: status === "confirmed" ? new Date() : null });
      } else {
        await db.update(btcDeposits).set({ confirmations, status, confirmedAt: status === "confirmed" ? existing[0].confirmedAt ?? new Date() : null }).where(eq(btcDeposits.id, existing[0].id));
      }
      const deposit = existing[0] ?? (await db.select().from(btcDeposits).where(eq(btcDeposits.transactionHash, chainTransaction.txid)).limit(1))[0];
      if (status === "confirmed") await creditConfirmedDeposit(db, deposit);
      synced.push({ ...deposit, confirmations, status });
    }
  }
  return synced;
}

async function creditConfirmedDeposit(db: any, deposit: any) {
  const referenceId = `btc-deposit:${deposit.id}`;
  const ledger = await db.select().from(ledgerTransactions).where(eq(ledgerTransactions.referenceId, referenceId)).limit(1);
  if (ledger[0]) return;
  await db.transaction(async (tx: any) => {
    await tx.insert(ledgerTransactions).values({ userId: deposit.userId, type: "deposit", asset: "BTC", amountSatoshis: deposit.amountSatoshis, referenceId, transactionHash: deposit.transactionHash, status: "completed" });
    const current = await tx.select().from(walletBalances).where(eq(walletBalances.userId, deposit.userId)).limit(1);
    if (current[0]) await tx.update(walletBalances).set({ btcBalanceSatoshis: current[0].btcBalanceSatoshis + deposit.amountSatoshis }).where(eq(walletBalances.userId, deposit.userId));
    else await tx.insert(walletBalances).values({ userId: deposit.userId, btcBalanceSatoshis: deposit.amountSatoshis });
  });
}

async function getBtcUsdPrice() {
  const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) return 0;
  const payload = await response.json() as { bitcoin?: { usd?: number } };
  return payload.bitcoin?.usd ?? 0;
}
