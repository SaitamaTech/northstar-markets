import { and, eq } from "drizzle-orm";
import { assets, investmentPositions, transactions, walletBalances, wallets } from "../drizzle/schema";
import { instruments } from "@shared/market-data";
import { getLiveInstrument } from "./market-provider";

export async function getMarketPrice(symbol: string) {
  const normalized = symbol.toUpperCase();
  const instrument = await getLiveInstrument(normalized);
  if (instrument && Number.isFinite(instrument.price)) return Number(instrument.price);

  const staticInstrument = instruments.find((item) => item.symbol.toUpperCase() === normalized);
  if (staticInstrument && Number.isFinite(staticInstrument.price)) return Number(staticInstrument.price);

  return 0;
}

export function calculatePositionValue(quantity: number, currentPrice: number, investedAmount: number) {
  const currentValue = quantity * currentPrice;
  const profitLoss = currentValue - investedAmount;
  return { currentValue, profitLoss, profitPercentage: investedAmount > 0 ? profitLoss / investedAmount * 100 : 0 };
}

export async function getPortfolio(db: any, userId: string) {
  const rows = await db.select().from(investmentPositions).innerJoin(assets, eq(investmentPositions.assetId, assets.id)).where(eq(investmentPositions.userId, userId));
  const positions = await Promise.all(rows.map(async (row: any) => {
    const position = row.investment_positions;
    const asset = row.assets;
    const currentPrice = await getMarketPrice(asset.symbol);
    return { ...position, asset, currentPrice, ...calculatePositionValue(Number(position.quantity), currentPrice, Number(position.investedAmount)) };
  }));
  const wallet = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  const btcWallet = await db.select().from(walletBalances).where(eq(walletBalances.userId, userId)).limit(1);
  const btcBalanceSatoshis = Number(btcWallet[0]?.btcBalanceSatoshis ?? 0);
  const cashBalance = Number(wallet[0]?.cashBalance ?? 0);
  const currentValue = positions.reduce((sum: number, position: any) => sum + position.currentValue, 0);
  const investedAmount = positions.reduce((sum: number, position: any) => sum + Number(position.investedAmount), 0);
  const profitLoss = currentValue - investedAmount;
  return {
    cashBalance,
    btcBalanceSatoshis,
    btcBalance: btcBalanceSatoshis / 100_000_000,
    positions,
    currentValue,
    investedAmount,
    profitLoss,
    profitPercentage: investedAmount > 0 ? profitLoss / investedAmount * 100 : 0,
    totalValue: cashBalance + currentValue,
    mode: "LIVE" as const,
  };
}

export { and, eq, assets, investmentPositions, transactions, wallets };