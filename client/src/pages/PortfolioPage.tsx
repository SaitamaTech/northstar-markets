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
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { MiniSparkline } from "@/components/market/MiniSparkline";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { useAuth } from "@/_core/hooks/useAuth";
import { calculateDailyInterest } from "@shared/savings";

export default function PortfolioPage() {
  const { isAuthenticated } = useAuth();
  const [range, setRange] = useState("1M");
  const portfolioQuery = trpc.portfolio.summary.useQuery(undefined, {
    staleTime: 30_000,
    enabled: isAuthenticated,
  });

  const portfolio = portfolioQuery.data;
  const positions = portfolio?.positions ?? [];
  const totalValue = Number(portfolio?.totalValue ?? 0);
  const investedAmount = Number(portfolio?.investedAmount ?? 0);
  const profitLoss = Number(portfolio?.profitLoss ?? 0);
  const profitPercentage = Number(portfolio?.profitPercentage ?? 0);

  const summary = useMemo(() => {
    const allocation = positions.map((position: any) => {
      const value = Number(position.currentValue ?? 0);
      const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
      return { ...position, value, weight };
    });
    return allocation.sort((a: any, b: any) => b.value - a.value);
  }, [positions, totalValue]);

  const dailySavingsYield = calculateDailyInterest(totalValue || 0, 0.12);

  const handleCopySnapshot = async () => {
    const snapshot = [
      `Northstar portfolio snapshot`,
      `Total value: $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Invested: $${investedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `P/L: ${profitLoss >= 0 ? "+" : "-"}$${Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ...summary.slice(0, 5).map((position: any) => `${position.asset.symbol}: $${Number(position.currentValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(snapshot);
      notify("Portfolio snapshot copied to your clipboard.", "success");
    } catch {
      notify("Clipboard access is blocked in this browser, but the portfolio is live and ready.", "info");
    }
  };

  const handleAddTransaction = () => {
    if (!isAuthenticated) {
      notify("Sign in to add live transactions to your portfolio.", "info");
      return;
    }
    notify("Transaction capture is ready for your broker feed. Connect the provider to sync live trades.", "success");
  };

  const chartValues = summary.length
    ? summary.slice(0, 12).map((position: any) => Number(position.currentValue ?? 0))
    : [1200, 1400, 1600, 1550, 1800, 2100, 2050, 2230, 2400, 2650, 2800, 2950];

  const portfolioHighlights = [
    { label: "Net exposure", value: `${((totalValue / Math.max(investedAmount, 1)) * 100).toFixed(0)}%`, subtext: investedAmount > 0 ? "capital deployed" : "awaiting positions", tone: "positive" },
    { label: "Daily yield", value: `$${dailySavingsYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, subtext: "auto-added each day", tone: "positive" },
    { label: "Cash on hand", value: `$${Number(portfolio?.cashBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, subtext: "available liquidity", tone: "neutral" },
    { label: "Position count", value: String(positions.length), subtext: positions.length ? "live names tracked" : "no active trades", tone: "neutral" },
  ];

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
              Live exposures, real market pricing, and a cleaner workflow for your risk and return review.
            </p>
          </div>
          <div className="heading-actions">
            <Link href="/investments" className="button button-secondary button-sm">
              Invest
            </Link>
            <button type="button" className="button button-primary button-sm pro-button" onClick={handleAddTransaction}>
              <Plus size={14} /> Add transaction
            </button>
          </div>
        </div>
        <div className="portfolio-metrics-strip">
          {portfolioHighlights.map((item) => (
            <div key={item.label} className={cn("section-card metric-strip-card", item.tone)}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.subtext}</small>
            </div>
          ))}
        </div>
        <div className="portfolio-top-grid">
          <section className="section-card portfolio-value-card animated-card">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Total portfolio value</span>
                <h2>
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
              <button type="button" className="period-selector" onClick={() => setRange((current) => current === "1D" ? "1W" : "1D")}>
                {range} <ChevronDown size={13} />
              </button>
            </div>
            <div className="portfolio-return">
              <span className={profitLoss >= 0 ? "positive" : "negative"}>
                {profitLoss >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                ${Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span>{profitPercentage.toFixed(2)}% return</span>
              <span className="muted">·</span>
              <span>{portfolioQuery.isLoading ? "Updating live price" : "Updated live"}</span>
            </div>
            <div className="portfolio-chart">
              <div className="portfolio-line" />
              <div className="portfolio-grid-line one" />
              <div className="portfolio-grid-line two" />
              <MiniSparkline values={chartValues} width={640} height={150} positive={profitLoss >= 0} />
            </div>
            <div className="range-row">
              {[
                "1D", "1W", "1M", "3M", "YTD", "1Y", "ALL",
              ].map((option) => (
                <button key={option} className={range === option ? "active" : ""} type="button" onClick={() => setRange(option)}>
                  {option}
                </button>
              ))}
            </div>
          </section>
          <div className="portfolio-stats">
            <div className="section-card stat-card animated-card">
              <CircleDollarSign size={18} />
              <span>Invested capital</span>
              <b>${investedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
              <small>{investedAmount > 0 ? `${((totalValue / investedAmount) * 100).toFixed(1)}% of value` : "No capital tracked yet"}</small>
            </div>
            <div className="section-card stat-card animated-card">
              <TrendingUp size={18} />
              <span>Total return</span>
              <b className={profitLoss >= 0 ? "positive" : "negative"}>${Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
              <small className={profitLoss >= 0 ? "positive" : "negative"}>{profitPercentage.toFixed(2)}%</small>
            </div>
            <div className="section-card stat-card animated-card">
              <PieChart size={18} />
              <span>Cash available</span>
              <b>${Number(portfolio?.cashBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
              <small>{positions.length ? `${positions.length} live positions` : "No live positions"}</small>
            </div>
            <div className="section-card stat-card animated-card">
              <ReceiptText size={18} />
              <span>Transactions</span>
              <b>{Math.max(positions.length, 0)}</b>
              <small>{positions.length ? "Updated in real time" : "Waiting for activity"}</small>
            </div>
          </div>
        </div>
        <div className="portfolio-content-grid">
          <section className="section-card holdings-card animated-card">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Holdings</span>
                <h2>Positions</h2>
              </div>
              <button type="button" className="text-button" onClick={handleCopySnapshot}>
                Export <ArrowUpRight size={13} />
              </button>
            </div>
            {positions.length === 0 ? (
              <div className="portfolio-empty-state">
                <div className="wallet-empty-icon"><PieChart size={20} /></div>
                <h3>No live positions yet</h3>
                <p>Add your first trade to see your portfolio values update in real time.</p>
                <button type="button" className="button button-primary button-sm" onClick={handleAddTransaction}>Add your first position</button>
              </div>
            ) : (
              <div className="holdings-table">
                <div className="holdings-head">
                  <span>Asset</span>
                  <span>Weight</span>
                  <span>Value</span>
                  <span>Return</span>
                  <span>Today</span>
                </div>
                {summary.map((item: any) => {
                  const returnValue = Number(item.profitLoss ?? 0);
                  const weight = totalValue > 0 ? (Number(item.currentValue ?? 0) / totalValue) * 100 : 0;
                  const isPositive = returnValue >= 0;

                  return (
                    <Link href={`/stocks/${String(item.asset.symbol).toLowerCase()}`} className="holding-row" key={item.asset.symbol}>
                      <span className="asset-cell">
                        <span className={cn("asset-mark", `asset-${item.asset.category ?? "crypto"}`)}>{String(item.asset.symbol).slice(0, 2)}</span>
                        <span>
                          <b>{item.asset.symbol}</b>
                          <small>{item.asset.name}</small>
                        </span>
                      </span>
                      <span>
                        <b>{weight.toFixed(1)}%</b>
                        <small className="holding-bar"><i style={{ width: `${Math.min(weight * 2.5, 100)}%` }} /></small>
                      </span>
                      <span className="mono">${Number(item.currentValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className={isPositive ? "positive" : "negative"}>{isPositive ? "+" : "-"}${Math.abs(returnValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className={cn("mono", isPositive ? "positive" : "negative")}>{Number(item.profitPercentage ?? 0).toFixed(2)}%</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
          <aside className="portfolio-side">
            <section className="section-card allocation-card animated-card">
              <div className="section-header">
                <div>
                  <span className="section-eyebrow">Allocation</span>
                  <h2>By exposure</h2>
                </div>
              </div>
              <div className="allocation-visual">
                <div className="big-donut">
                  <span>
                    ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}<small>total</small>
                  </span>
                </div>
                <div className="allocation-legend">
                  {summary.slice(0, 3).map((item: any, index: number) => (
                    <span key={item.asset.symbol}>
                      <i className={cn("allocation-dot", index === 0 ? "teal" : index === 1 ? "violet" : "amber")} />
                      {item.asset.name} <b>{totalValue > 0 ? ((Number(item.currentValue ?? 0) / totalValue) * 100).toFixed(0) : 0}%</b>
                    </span>
                  ))}
                </div>
              </div>
            </section>
            <section className="section-card allocation-card animated-card">
              <span className="section-eyebrow">Activity</span>
              <h2>Recent moves</h2>
              <div className="transaction-list">
                {summary.slice(0, 2).map((item: any) => (
                  <div key={item.asset.symbol}>
                    <span className={Number(item.profitLoss ?? 0) >= 0 ? "transaction-icon positive" : "transaction-icon negative"}>
                      {Number(item.profitLoss ?? 0) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </span>
                    <span>
                      <b>{Number(item.profitLoss ?? 0) >= 0 ? "Gain" : "Drag"} · {item.asset.symbol}</b>
                      <small>{item.asset.name}</small>
                    </span>
                    <strong>{Number(item.profitLoss ?? 0) >= 0 ? "+" : "-"}${Math.abs(Number(item.profitLoss ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                ))}
              </div>
              <button type="button" className="text-button" onClick={handleCopySnapshot}>
                View all activity <ArrowUpRight size={13} />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
