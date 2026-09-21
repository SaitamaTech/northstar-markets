import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  CircleDollarSign,
  PieChart,
  Plus,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { MiniSparkline } from "@/components/market/MiniSparkline";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { useState } from "react";

export default function PortfolioPage() {
  const [range, setRange] = useState("1D");
  const query = trpc.market.instruments.useQuery(undefined, {
    staleTime: 60_000,
  });
  const holdings = (query.data ?? []).filter(item =>
    ["NVDA", "AAPL", "VOO", "BTC", "MSFT"].includes(item.symbol)
  );
  return (
    <AppShell>
      <div className="page-shell feature-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span>/</span>
              <strong>Portfolio</strong>
            </div>
            <h1>Portfolio lab</h1>
            <p>
              See the shape of your exposure, the sources of return, and the
              risks worth reviewing.
            </p>
          </div>
          <div className="heading-actions">
            <button type="button" className="button button-primary button-sm" onClick={() => notify("Transaction entry is not connected to a trading provider yet.")}>
              <Plus size={14} /> Add transaction
            </button>
          </div>
        </div>
        <div className="portfolio-top-grid">
          <section className="section-card portfolio-value-card">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Total portfolio value</span>
                <h2>
                  $128,642<span className="decimal">.18</span>
                </h2>
              </div>
              <button type="button" className="period-selector" onClick={() => setRange(range === "1D" ? "1W" : "1D")}>
                {range} <ChevronDown size={13} />
              </button>
            </div>
            <div className="portfolio-return">
              <span className="positive">
                <ArrowUpRight size={14} />
                +$1,842.24
              </span>
              <span>+1.45% today</span>
              <span className="muted">·</span>
              <span>Updated 14:32 ET</span>
            </div>
            <div className="portfolio-chart">
              <div className="portfolio-line" />
              <div className="portfolio-grid-line one" />
              <div className="portfolio-grid-line two" />
              <MiniSparkline
                values={[
                  82, 83, 82, 87, 84, 89, 90, 94, 92, 99, 101, 100, 107, 110,
                  114, 113, 120, 124, 122, 128,
                ]}
                width={640}
                height={150}
              />
            </div>
            <div className="range-row">
              <button className={range === "1D" ? "active" : ""} type="button" onClick={() => setRange("1D")}>
                1D
              </button>
              <button className={range === "1W" ? "active" : ""} type="button" onClick={() => setRange("1W")}>1W</button>
              <button className={range === "1M" ? "active" : ""} type="button" onClick={() => setRange("1M")}>1M</button>
              <button className={range === "3M" ? "active" : ""} type="button" onClick={() => setRange("3M")}>3M</button>
              <button className={range === "YTD" ? "active" : ""} type="button" onClick={() => setRange("YTD")}>YTD</button>
              <button className={range === "1Y" ? "active" : ""} type="button" onClick={() => setRange("1Y")}>1Y</button>
              <button className={range === "ALL" ? "active" : ""} type="button" onClick={() => setRange("ALL")}>ALL</button>
            </div>
          </section>
          <div className="portfolio-stats">
            <div className="section-card stat-card">
              <CircleDollarSign size={18} />
              <span>Invested capital</span>
              <b>$104,218</b>
              <small>81.0% of value</small>
            </div>
            <div className="section-card stat-card">
              <TrendingUp size={18} />
              <span>Total return</span>
              <b className="positive">+$24,424</b>
              <small className="positive">+23.44%</small>
            </div>
            <div className="section-card stat-card">
              <PieChart size={18} />
              <span>Income received</span>
              <b>$1,284</b>
              <small>12 dividends</small>
            </div>
            <div className="section-card stat-card">
              <ReceiptText size={18} />
              <span>Transactions</span>
              <b>36</b>
              <small>Last added 4d ago</small>
            </div>
          </div>
        </div>
        <div className="portfolio-content-grid">
          <section className="section-card holdings-card">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Holdings</span>
                <h2>Positions</h2>
              </div>
              <button type="button" className="text-button" onClick={() => notify("Holdings export is not available until live portfolio records are connected.")}>
                Export <ArrowUpRight size={13} />
              </button>
            </div>
            <div className="holdings-table">
              <div className="holdings-head">
                <span>Asset</span>
                <span>Weight</span>
                <span>Value</span>
                <span>Return</span>
                <span>Today</span>
              </div>
              {holdings.map((item, index) => (
                <Link
                  href={`/stocks/${item.symbol.toLowerCase()}`}
                  className="holding-row"
                  key={item.symbol}
                >
                  <span className="asset-cell">
                    <span
                      className={cn("asset-mark", `asset-${item.category}`)}
                    >
                      {item.symbol.slice(0, 2)}
                    </span>
                    <span>
                      <b>{item.symbol}</b>
                      <small>{item.name}</small>
                    </span>
                  </span>
                  <span>
                    <b>{[25, 20, 30, 15, 10][index]}%</b>
                    <small className="holding-bar">
                      <i
                        style={{
                          width: `${[25, 20, 30, 15, 10][index] * 2.4}%`,
                        }}
                      />
                    </small>
                  </span>
                  <span className="mono">
                    $
                    {[32144, 25698, 38592, 19296, 12864][
                      index
                    ].toLocaleString()}
                  </span>
                  <span
                    className={item.changePct >= 0 ? "positive" : "negative"}
                  >
                    {item.changePct >= 0 ? "+" : ""}
                    {[34.2, 18.6, 14.8, 8.4, -2.2][index]}%
                  </span>
                  <span
                    className={cn(
                      "mono",
                      item.changePct >= 0 ? "positive" : "negative"
                    )}
                  >
                    {item.changePct >= 0 ? "+" : ""}
                    {item.changePct.toFixed(2)}%
                  </span>
                </Link>
              ))}
            </div>
          </section>
          <aside className="portfolio-side">
            <section className="section-card allocation-card">
              <div className="section-header">
                <div>
                  <span className="section-eyebrow">Allocation</span>
                  <h2>By exposure</h2>
                </div>
              </div>
              <div className="allocation-visual">
                <div className="big-donut">
                  <span>
                    $128k<small>total</small>
                  </span>
                </div>
                <div className="allocation-legend">
                  <span>
                    <i className="allocation-dot teal" />
                    Equities <b>62%</b>
                  </span>
                  <span>
                    <i className="allocation-dot violet" />
                    Crypto <b>23%</b>
                  </span>
                  <span>
                    <i className="allocation-dot amber" />
                    Cash <b>15%</b>
                  </span>
                </div>
              </div>
            </section>
            <section className="section-card allocation-card">
              <span className="section-eyebrow">Activity</span>
              <h2>Recent transactions</h2>
              <div className="transaction-list">
                <div>
                  <span className="transaction-icon positive">
                    <ArrowUpRight size={14} />
                  </span>
                  <span>
                    <b>Buy · NVDA</b>
                    <small>20 shares · Sep 01</small>
                  </span>
                  <strong>+$2,373</strong>
                </div>
                <div>
                  <span className="transaction-icon negative">
                    <ArrowDownRight size={14} />
                  </span>
                  <span>
                    <b>Sell · TSLA</b>
                    <small>8 shares · Aug 29</small>
                  </span>
                  <strong>-$1,728</strong>
                </div>
              </div>
              <button type="button" className="text-button" onClick={() => notify("Transaction history will appear when account activity is connected.")}>
                View all activity <ArrowUpRight size={13} />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
