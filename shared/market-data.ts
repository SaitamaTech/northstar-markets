export type AssetCategory = "index" | "stock" | "crypto" | "forex" | "commodity" | "etf";

export type MarketInstrument = {
  symbol: string;
  name: string;
  category: AssetCategory;
  exchange: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
  marketCap: string;
  status?: "open" | "closed" | "24h";
  sparkline: number[];
};

export type NewsItem = {
  id: string;
  category: string;
  headline: string;
  source: string;
  time: string;
  readTime: string;
  tone: "blue" | "amber" | "rose" | "violet";
  url?: string;
};

export type EconomicEvent = {
  time: string;
  country: string;
  flag: string;
  event: string;
  importance: "high" | "medium" | "low";
  actual: string;
  forecast: string;
  previous: string;
  date?: string;
};

export const marketOverview = [
  { symbol: "SPX", name: "S&P 500", price: 5634.61, change: 30.52, changePct: 0.54, status: "Open", session: "US" },
  { symbol: "NDX", name: "Nasdaq 100", price: 19691.03, change: 142.27, changePct: 0.73, status: "Open", session: "US" },
  { symbol: "DJI", name: "Dow Jones", price: 41393.78, change: 92.87, changePct: 0.22, status: "Open", session: "US" },
  { symbol: "DAX", name: "DAX", price: 18456.91, change: -83.2, changePct: -0.45, status: "Closed", session: "EU" },
  { symbol: "FTSE", name: "FTSE 100", price: 8270.84, change: -16.04, changePct: -0.19, status: "Closed", session: "EU" },
  { symbol: "N225", name: "Nikkei 225", price: 38686.93, change: 241.54, changePct: 0.63, status: "Closed", session: "APAC" },
];

export const instruments: MarketInstrument[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", category: "stock", exchange: "NASDAQ", price: 118.67, change: 3.41, changePct: 2.96, volume: "312.8M", marketCap: "$2.91T", status: "open", sparkline: [84, 86, 84, 89, 88, 94, 93, 99, 102, 100, 108, 110, 118] },
  { symbol: "AAPL", name: "Apple Inc.", category: "stock", exchange: "NASDAQ", price: 226.05, change: 1.11, changePct: 0.49, volume: "48.6M", marketCap: "$3.44T", status: "open", sparkline: [96, 98, 97, 100, 99, 103, 102, 104, 106, 105, 107, 108, 109] },
  { symbol: "MSFT", name: "Microsoft Corp.", category: "stock", exchange: "NASDAQ", price: 421.19, change: -2.16, changePct: -0.51, volume: "16.3M", marketCap: "$3.13T", status: "open", sparkline: [110, 114, 113, 116, 115, 112, 114, 110, 111, 109, 110, 108, 107] },
  { symbol: "AMZN", name: "Amazon.com Inc.", category: "stock", exchange: "NASDAQ", price: 186.49, change: 2.84, changePct: 1.55, volume: "42.4M", marketCap: "$1.96T", status: "open", sparkline: [78, 80, 81, 79, 84, 86, 85, 89, 91, 90, 94, 96, 101] },
  { symbol: "META", name: "Meta Platforms", category: "stock", exchange: "NASDAQ", price: 509.27, change: 5.24, changePct: 1.04, volume: "12.9M", marketCap: "$1.29T", status: "open", sparkline: [90, 91, 89, 92, 94, 93, 95, 97, 96, 99, 101, 100, 104] },
  { symbol: "TSLA", name: "Tesla Inc.", category: "stock", exchange: "NASDAQ", price: 216.21, change: -4.78, changePct: -2.16, volume: "91.7M", marketCap: "$691.4B", status: "open", sparkline: [105, 104, 101, 103, 98, 97, 94, 92, 95, 91, 89, 90, 86] },
  { symbol: "BTC", name: "Bitcoin", category: "crypto", exchange: "CRYPTO", price: 63542.2, change: 1182.4, changePct: 1.9, volume: "$31.8B", marketCap: "$1.25T", status: "24h", sparkline: [98, 96, 100, 97, 102, 104, 101, 105, 108, 107, 110, 113, 116] },
  { symbol: "ETH", name: "Ethereum", category: "crypto", exchange: "CRYPTO", price: 3468.82, change: -42.16, changePct: -1.2, volume: "$14.2B", marketCap: "$417.1B", status: "24h", sparkline: [106, 107, 104, 105, 102, 104, 101, 100, 99, 98, 97, 96, 95] },
  { symbol: "EUR/USD", name: "Euro / US Dollar", category: "forex", exchange: "FOREX", price: 1.1084, change: 0.0016, changePct: 0.14, volume: "—", marketCap: "—", status: "24h", sparkline: [92, 93, 92, 94, 95, 94, 96, 97, 96, 98, 99, 100, 101] },
  { symbol: "GC", name: "Gold Futures", category: "commodity", exchange: "COMEX", price: 2518.7, change: 11.3, changePct: 0.45, volume: "184.2K", marketCap: "—", status: "open", sparkline: [88, 90, 89, 91, 90, 94, 95, 96, 98, 97, 100, 102, 104] },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", category: "etf", exchange: "NYSE Arca", price: 516.42, change: 2.66, changePct: 0.52, volume: "2.1M", marketCap: "$550.2B", status: "open", sparkline: [90, 91, 92, 91, 94, 95, 95, 97, 98, 99, 101, 102, 103] },
  { symbol: "XLE", name: "Energy Select Sector SPDR", category: "etf", exchange: "NYSE Arca", price: 90.12, change: -0.21, changePct: -0.23, volume: "8.4M", marketCap: "$38.9B", status: "open", sparkline: [101, 100, 102, 99, 98, 99, 96, 95, 96, 94, 93, 94, 92] },
];

export const newsItems: NewsItem[] = [
  { id: "n1", category: "MARKETS", headline: "Equities find a bid as softer inflation data resets rate expectations", source: "Northstar Wire", time: "8 min ago", readTime: "4 min read", tone: "blue" },
  { id: "n2", category: "TECHNOLOGY", headline: "Chipmakers lead the rebound as AI infrastructure spending stays resilient", source: "Market Ledger", time: "24 min ago", readTime: "6 min read", tone: "violet" },
  { id: "n3", category: "MACRO", headline: "Treasury curve steepens ahead of the central bank symposium", source: "Signal Research", time: "41 min ago", readTime: "5 min read", tone: "amber" },
  { id: "n4", category: "CRYPTO", headline: "Bitcoin liquidity improves as digital-asset funds see fourth straight inflow", source: "Blockline", time: "1 hr ago", readTime: "3 min read", tone: "rose" },
];

export function getEconomicEvents(referenceDate = new Date()): EconomicEvent[] {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const mondayOffset = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - mondayOffset);

  const dates = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const templates: Array<Omit<EconomicEvent, "date">> = [
    { time: "09:45", country: "United States", flag: "US", event: "S&P Global Manufacturing PMI", importance: "medium", actual: "47.9", forecast: "48.1", previous: "49.6" },
    { time: "10:00", country: "United States", flag: "US", event: "ISM Manufacturing PMI", importance: "high", actual: "47.2", forecast: "47.5", previous: "46.8" },
    { time: "11:30", country: "Euro Area", flag: "EU", event: "ECB Lane Speech", importance: "low", actual: "—", forecast: "—", previous: "—" },
    { time: "14:00", country: "United States", flag: "US", event: "JOLTS Job Openings", importance: "high", actual: "—", forecast: "8.10M", previous: "8.18M" },
    { time: "16:00", country: "Japan", flag: "JP", event: "Consumer Confidence", importance: "medium", actual: "—", forecast: "36.4", previous: "36.7" },
  ];

  return templates.map((template, index) => ({
    ...template,
    date: dates[index]?.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));
}

export const economicEvents = getEconomicEvents();

export function getUpcomingEarnings(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const mondayOffset = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - mondayOffset);

  const dayOffsets = [0, 1, 2, 3, 4];
  const rows = [
    ["Broadcom", "$1.21", "$13.0B", "After close"],
    ["Adobe", "$4.53", "$5.37B", "After close"],
    ["Oracle", "$1.48", "$13.2B", "After close"],
    ["Lennar", "$3.92", "$9.1B", "Before open"],
    ["MongoDB", "$0.97", "$0.45B", "After close"],
  ];

  return rows.map((row, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayOffsets[index % dayOffsets.length]);
    return {
      company: row[0],
      eps: row[1],
      revenue: row[2],
      dateLabel: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      session: row[3],
    };
  });
}

export const categoryLabels: Record<AssetCategory, string> = {
  index: "Indices",
  stock: "Stocks",
  crypto: "Crypto",
  forex: "Forex",
  commodity: "Commodities",
  etf: "ETFs",
};

export function getChartSeries(symbol: string) {
  const instrument = instruments.find((item) => item.symbol === symbol) ?? instruments[0];
  const base = instrument.sparkline[instrument.sparkline.length - 1] ?? 100;
  return instrument.sparkline.map((value, index) => ({
    label: ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "Now"][index],
    value: Number((value / base * instrument.price).toFixed(2)),
  }));
}

export const dashboardSummary = {
  portfolioValue: 128642.18,
  portfolioChange: 1842.24,
  portfolioChangePct: 1.45,
  watchlistCount: 18,
  alertsCount: 4,
  nextEvent: "ISM Manufacturing PMI",
};
