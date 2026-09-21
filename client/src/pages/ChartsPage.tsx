import {
  CandlestickChart,
  ChevronDown,
  Crosshair,
  Layers3,
  Plus,
  Search,
  Settings2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MarketChart } from "@/components/market/MarketChart";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

export default function ChartsPage() {
  const [symbol, setSymbol] = useState("NVDA");
  const [range, setRange] = useState("1D");
  const instrumentsQuery = trpc.market.instruments.useQuery(undefined, {
    staleTime: 60_000,
  });
  const chartQuery = trpc.market.chart.useQuery(
    { symbol },
    { staleTime: 60_000 }
  );
  const instrument =
    instrumentsQuery.data?.find(item => item.symbol === symbol) ??
    instrumentsQuery.data?.[0];
  const options = useMemo(
    () => instrumentsQuery.data ?? [],
    [instrumentsQuery.data]
  );
  const saveLayout = () => {
    localStorage.setItem("northstar-chart-layout", JSON.stringify({ symbol, range }));
    notify("Chart layout saved.", "success");
  };
  return (
    <AppShell>
      <div className="page-shell feature-shell charts-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span>/</span>
              <strong>Charts</strong>
            </div>
            <h1>Chart workspace</h1>
            <p>
              Build a focused view of price action with a clean canvas for your
              next question.
            </p>
          </div>
          <div className="heading-actions">
            <button type="button" className="button button-secondary button-sm" onClick={saveLayout}>
              <Layers3 size={14} /> Save layout
            </button>
          </div>
        </div>
        <section className="section-card advanced-chart-card">
          <div className="advanced-chart-toolbar">
            <div className="instrument-picker">
              <Search size={15} />
              <select
                value={symbol}
                onChange={event => setSymbol(event.target.value)}
              >
                {options.map(item => (
                  <option key={item.symbol} value={item.symbol}>
                    {item.symbol} · {item.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <div className="chart-toolbar-groups">
              <div className="toolbar-segment">
                <button type="button" className={range === "1D" ? "active" : ""} onClick={() => setRange("1D")}>
                  1D
                </button>
                <button type="button" className={range === "5D" ? "active" : ""} onClick={() => setRange("5D")}>5D</button>
                <button type="button" className={range === "1M" ? "active" : ""} onClick={() => setRange("1M")}>1M</button>
                <button type="button" className={range === "3M" ? "active" : ""} onClick={() => setRange("3M")}>3M</button>
                <button type="button" className={range === "1Y" ? "active" : ""} onClick={() => setRange("1Y")}>1Y</button>
              </div>
              <button type="button" className="select-button" onClick={() => notify("Chart type: Area") }>
                <CandlestickChart size={14} /> Area <ChevronDown size={13} />
              </button>
              <button type="button" className="select-button" onClick={() => notify("Indicators: Volume and 20 EMA") }>
                <Crosshair size={14} /> Indicators <ChevronDown size={13} />
              </button>
              <button type="button" className="icon-button bordered" onClick={() => notify("Chart settings opened.")}>
                <Settings2 size={15} />
              </button>
            </div>
          </div>
          {instrument && (
            <div className="advanced-quote">
              <div>
                <b>{instrument.symbol}</b>
                <span>{instrument.name}</span>
              </div>
              <strong>
                {instrument.price.toLocaleString(undefined, {
                  maximumFractionDigits: instrument.price < 10 ? 4 : 2,
                })}
              </strong>
              <span
                className={instrument.changePct >= 0 ? "positive" : "negative"}
              >
                {instrument.changePct >= 0 ? "+" : ""}
                {instrument.changePct.toFixed(2)}%
              </span>
              <button
                type="button"
                className="button button-secondary button-sm"
              >
                <Plus size={13} /> Compare
              </button>
            </div>
          )}
          {instrument && (
            <MarketChart
              instrument={instrument}
              series={chartQuery.data ?? []}
            />
          )}
        </section>
        <div className="indicator-row">
          <span>Active indicators</span>
          <button type="button" className="indicator-chip" onClick={() => notify("Volume indicator selected.")}>
            Volume <span>×</span>
          </button>
          <button type="button" className="indicator-chip" onClick={() => notify("20 EMA indicator selected.")}>
            20 EMA <span>×</span>
          </button>
          <button type="button" className="add-indicator">
            <Plus size={13} /> Add indicator
          </button>
        </div>
        <div className="research-note">
          <span>Charts reflect the latest available market quotes.</span>
          <span>All investing involves risk.</span>
        </div>
      </div>
    </AppShell>
  );
}
