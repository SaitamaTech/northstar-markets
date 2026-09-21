import { instruments, type MarketInstrument } from "@shared/market-data";

type CoinGeckoMarket = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  total_volume: number | null;
  market_cap: number | null;
  sparkline_in_7d?: { price?: number[] };
};

const cryptoIds = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple", "cardano", "dogecoin", "avalanche-2", "chainlink", "tether", "usd-coin"];
let cachedCrypto: MarketInstrument[] | null = null;
let cachedAt = 0;

function formatCompact(value: number | null, prefix = "$") {
  if (value === null) return "-";
  if (value >= 1_000_000_000_000) return `${prefix}${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `${prefix}${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(2)}M`;
  return `${prefix}${value.toLocaleString()}`;
}

function normalizeQuote(item: CoinGeckoMarket): MarketInstrument {
  const price = item.current_price;
  const changePct = item.price_change_percentage_24h ?? 0;
  const change = item.price_change_24h ?? price * changePct / 100;
  const sparkline = item.sparkline_in_7d?.price?.slice(-13) ?? [];
  return {
    symbol: item.symbol.toUpperCase(),
    name: item.name,
    category: "crypto",
    exchange: "CRYPTO",
    price,
    change,
    changePct,
    volume: formatCompact(item.total_volume),
    marketCap: formatCompact(item.market_cap),
    status: "24h",
    sparkline: sparkline.length >= 2 ? sparkline : [price * 0.98, price * 0.99, price],
  };
}

export async function getLiveCryptoInstruments(): Promise<MarketInstrument[]> {
  const now = Date.now();
  if (cachedCrypto && now - cachedAt < 30_000) return cachedCrypto;

  const endpoint = process.env.MARKET_DATA_API_URL ?? "https://api.coingecko.com/api/v3/coins/markets";
  const url = new URL(endpoint);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", cryptoIds.join(","));
  url.searchParams.set("sparkline", "true");
  url.searchParams.set("price_change_percentage", "24h");
  const headers: Record<string, string> = { accept: "application/json" };
  if (process.env.COINGECKO_API_KEY) headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;

  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error(`Market provider returned ${response.status}`);
    const payload = await response.json() as CoinGeckoMarket[];
    cachedCrypto = payload.map(normalizeQuote);
    cachedAt = now;
    return cachedCrypto;
  } catch (error) {
    console.warn("[Market data] Live crypto provider unavailable:", error);
    return cachedCrypto ?? instruments.filter(item => item.category === "crypto");
  }
}

export async function getLiveInstruments(category?: string) {
  const liveCrypto = await getLiveCryptoInstruments();
  const liveBySymbol = new Map(liveCrypto.map(item => [item.symbol, item]));
  const merged = instruments.map(item => liveBySymbol.get(item.symbol) ?? item);
  return category && category !== "all" ? merged.filter(item => item.category === category) : merged;
}

export async function getLiveInstrument(symbol: string) {
  const all = await getLiveInstruments();
  return all.find(item => item.symbol.toUpperCase() === symbol.toUpperCase()) ?? null;
}
