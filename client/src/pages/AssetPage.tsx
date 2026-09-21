import {
  ArrowLeft,
  BellPlus,
  Bookmark,
  ChevronRight,
  ExternalLink,
  Info,
  Plus,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { AppShell } from "@/components/AppShell";
import { MarketChart } from "@/components/market/MarketChart";
import { MiniSparkline } from "@/components/market/MiniSparkline";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

const tabs = [
  "Overview",
  "Chart",
  "News",
  "Analysis",
  "Financials",
  "Statistics",
  "Earnings",
];

export default function AssetPage() {
  const [, setLocation] = useLocation();
  const [, stockParams] = useRoute("/stocks/:symbol");
  const [, cryptoParams] = useRoute("/crypto/:symbol");
  const symbol = (
    stockParams?.symbol ??
    cryptoParams?.symbol ??
    "nvda"
  ).toUpperCase();
  const [activeTab, setActiveTab] = useState("Overview");
  const instrumentQuery = trpc.market.instrument.useQuery(
    { symbol },
    { staleTime: 60_000 }
  );
  const chartQuery = trpc.market.chart.useQuery(
    { symbol },
    { staleTime: 60_000 }
  );
  const newsQuery = trpc.market.news.useQuery(undefined, { staleTime: 60_000 });
  const instrument = instrumentQuery.data;
  const relatedNews = useMemo(
    () => (newsQuery.data ?? []).slice(0, 3),
    [newsQuery.data]
  );

  if (!instrument)
    return (
      <AppShell>
        <div className="page-shell loading-state">
          <div className="loading-orb" />
          <p>Loading instrument profile…</p>
        </div>
      </AppShell>
    );
  const positive = instrument.changePct >= 0;

  return (
    <AppShell>
      <div className="page-shell feature-shell asset-shell">
        <div className="asset-breadcrumb">
          <button
            type="button"
            className="back-button"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={14} /> Back to markets
          </button>
          <span>/</span>
          <span>{instrument.category.toUpperCase()}</span>
          <ChevronRight size={13} />
          <strong>{instrument.symbol}</strong>
        </div>
        <section className="asset-header-card">
          <div className="asset-title-row">
            <div className="asset-title-group">
              <div
                className={cn(
                  "asset-mark large",
                  `asset-${instrument.category}`
                )}
              >
                {instrument.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="asset-kicker">
                  <span>{instrument.exchange}</span>
                  <span className="status-tag">
                    <i className="status-dot open" /> Market open
                  </span>
                </div>
                <h1>{instrument.name}</h1>
                <span className="asset-symbol">
                  {instrument.symbol} ·{" "}
                  {instrument.category === "stock"
                    ? "Common stock"
                    : "Spot instrument"}
                </span>
              </div>
            </div>
            <div className="asset-actions">
              <button
                type="button"
                className="button button-secondary button-sm"
                onClick={() => notify(`${instrument.symbol} added to your watchlist.`, "success")}
              >
                <Star size={14} /> Watchlist
              </button>
              <button
                type="button"
                className="icon-button bordered"
                aria-label="Create alert"
                onClick={() => notify(`Price alert created for ${instrument.symbol}.`, "success")}
              >
                <BellPlus size={16} />
              </button>
              <button
                type="button"
                className="icon-button bordered"
                aria-label="Share"
                onClick={() => void navigator.clipboard?.writeText(window.location.href)}
              >
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
          <div className="asset-quote-bar">
            <div>
              <span className="metric-label">Last price</span>
              <strong className="asset-price">
                {instrument.price.toLocaleString(undefined, {
                  maximumFractionDigits: instrument.price < 10 ? 4 : 2,
                })}
              </strong>
              <span
                className={cn(
                  "asset-change",
                  positive ? "positive" : "negative"
                )}
              >
                {positive ? "+" : ""}
                {instrument.change.toFixed(instrument.price < 10 ? 4 : 2)} (
                {positive ? "+" : ""}
                {instrument.changePct.toFixed(2)}%)
              </span>
            </div>
            <div className="asset-quote-stat">
              <span>Day range</span>
              <b>
                {(instrument.price * 0.972).toFixed(2)} —{" "}
                {(instrument.price * 1.018).toFixed(2)}
              </b>
            </div>
            <div className="asset-quote-stat">
              <span>52 week range</span>
              <b>
                {(instrument.price * 0.61).toFixed(2)} —{" "}
                {(instrument.price * 1.23).toFixed(2)}
              </b>
            </div>
            <div className="asset-quote-stat">
              <span>Volume</span>
              <b>{instrument.volume}</b>
            </div>
            <MiniSparkline
              values={instrument.sparkline}
              positive={positive}
              width={115}
              height={40}
            />
          </div>
        </section>
        <div className="asset-tabs">
          {tabs.map(tab => (
            <button
              type="button"
              key={tab}
              className={cn("asset-tab", activeTab === tab && "active")}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="asset-content-grid">
          <div className="asset-main-column">
            <section className="section-card chart-card asset-chart-card">
              <div className="section-header">
                <div>
                  <span className="section-eyebrow">Price action</span>
                  <h2>{instrument.symbol} chart</h2>
                </div>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setLocation("/charts")}
                >
                  Open advanced workspace <ExternalLink size={13} />
                </button>
              </div>
              <MarketChart
                instrument={instrument}
                series={chartQuery.data ?? []}
              />
            </section>
            <section className="section-card financial-snapshot">
              <div className="section-header">
                <div>
                  <span className="section-eyebrow">Fundamentals</span>
                  <h2>Key statistics</h2>
                </div>
                <button type="button" className="text-button" onClick={() => notify("Financial statistics are shown in the overview.")}>
                  View financials <ChevronRight size={14} />
                </button>
              </div>
              <div className="stat-grid">
                <div>
                  <span>Market cap</span>
                  <b>{instrument.marketCap}</b>
                  <small>+8.4% YoY</small>
                </div>
                <div>
                  <span>P/E ratio</span>
                  <b>32.18</b>
                  <small>vs. sector 28.4</small>
                </div>
                <div>
                  <span>EPS (TTM)</span>
                  <b>$3.68</b>
                  <small>+92.1% YoY</small>
                </div>
                <div>
                  <span>Revenue growth</span>
                  <b>+18.2%</b>
                  <small>last 12 months</small>
                </div>
                <div>
                  <span>Dividend yield</span>
                  <b>0.03%</b>
                  <small>quarterly</small>
                </div>
                <div>
                  <span>52w performance</span>
                  <b className="positive">+142.7%</b>
                  <small>relative strength 91</small>
                </div>
              </div>
            </section>
          </div>
          <aside className="asset-side-column">
            <section className="section-card action-card">
              <div className="action-card-icon">
                <Bookmark size={18} />
              </div>
              <h3>Track {instrument.symbol}</h3>
              <p>
                Save this instrument to your workspace or create a price alert.
              </p>
              <button
                type="button"
                className="button button-primary full-button"
                onClick={() => notify(`${instrument.symbol} added to your watchlist.`, "success")}
              >
                <Plus size={14} /> Add to watchlist
              </button>
              <button
                type="button"
                className="button button-secondary full-button"
                onClick={() => notify(`Price alert created for ${instrument.symbol}.`, "success")}
              >
                <BellPlus size={14} /> Create alert
              </button>
            </section>
            <section className="section-card related-card">
              <div className="section-header">
                <div>
                  <span className="section-eyebrow">Signal desk</span>
                  <h2>Related news</h2>
                </div>
                <Link href="/news" className="text-button">
                  All <ChevronRight size={14} />
                </Link>
              </div>
              {relatedNews.map(item => (
                <Link
                  href={`/news/${item.id}`}
                  className="related-news"
                  key={item.id}
                >
                  <span className={cn("related-dot", `news-${item.tone}`)} />
                  <div>
                    <strong>{item.headline}</strong>
                    <small>
                      {item.source} · {item.time}
                    </small>
                  </div>
                </Link>
              ))}
            </section>
            <div className="risk-note">
              <ShieldCheck size={15} />
              <span>
                <b>Research context</b> Northstar surfaces market information,
                not personalized investment advice.
              </span>
              <Info size={14} />
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
