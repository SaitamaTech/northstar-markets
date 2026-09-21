import {
  Filter,
  LayoutGrid,
  ListFilter,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { MarketTable } from "@/components/market/MarketTable";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

const copy: Record<
  string,
  { title: string; description: string; label: string }
> = {
  all: {
    title: "Markets",
    description:
      "Track the instruments shaping the global session across regions and asset classes.",
    label: "All markets",
  },
  stock: {
    title: "Stocks",
    description:
      "Equities with the clearest signal across momentum, liquidity, and market cap.",
    label: "US equities",
  },
  crypto: {
    title: "Digital assets",
    description:
      "A clean read on 24-hour crypto markets, liquidity, and relative strength.",
    label: "Crypto",
  },
  forex: {
    title: "Foreign exchange",
    description:
      "Major and cross currency pairs with a professional, session-aware view.",
    label: "FX pairs",
  },
  commodity: {
    title: "Commodities",
    description:
      "Energy, metals, and raw materials moving through the global macro cycle.",
    label: "Commodities",
  },
  etf: {
    title: "ETFs",
    description:
      "Explore diversified exposure, flows, fees, and market breadth in one view.",
    label: "ETF universe",
  },
};

export default function MarketPage({
  category = "all",
}: {
  category?: string;
}) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");
  const queryInput = useMemo(
    () => (category === "all" ? undefined : { category }),
    [category]
  );
  const query = trpc.market.instruments.useQuery(queryInput, {
    staleTime: 60_000,
  });
  const content = copy[category] ?? copy.all;
  const data = useMemo(
    () =>
      (query.data ?? []).filter(item =>
        `${item.symbol} ${item.name}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [query.data, search]
  );

  return (
    <AppShell>
      <div className="page-shell feature-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Markets</span>
              <span>/</span>
              <strong>{content.label}</strong>
            </div>
            <h1>{content.title}</h1>
            <p>{content.description}</p>
          </div>
          <div className="heading-actions">
            <span className="data-asof">
              <span className="live-dot" /> Live market data
            </span>
            <button type="button" className="button button-secondary button-sm" onClick={() => notify("Market customization is available from the table controls.")}>
              <SlidersHorizontal size={14} /> Customize
            </button>
          </div>
        </div>
        <div className="category-nav">
          {[
            ["all", "Overview"],
            ["stock", "Stocks"],
            ["crypto", "Crypto"],
            ["forex", "Forex"],
            ["commodity", "Commodities"],
            ["etf", "ETFs"],
          ].map(([id, label]) => (
            <button
              type="button"
              className={cn("category-pill", category === id && "active")}
              key={id}
              onClick={() =>
                setLocation(
                  id === "all"
                    ? "/markets"
                    : `/${id === "stock" ? "stocks" : id === "commodity" ? "commodities" : `${id}`}`
                )
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="market-page-grid">
          <section className="section-card full-market-card">
            <div className="market-toolbar">
              <div>
                <span className="section-eyebrow">Universe</span>
                <h2>
                  {content.label}
                  <span className="result-count">{data.length} tracked</span>
                </h2>
              </div>
              <div className="market-toolbar-actions">
                <div className="table-search">
                  <Search size={15} />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Filter symbols or names"
                  />
                </div>
                <button
                  type="button"
                  className="button button-secondary button-sm"
                  onClick={() => notify("Use the search field to filter symbols and names.")}
                >
                  <Filter size={14} /> Filters
                </button>
                <div className="view-switcher">
                  <button
                    type="button"
                    className={view === "table" ? "active" : ""}
                    onClick={() => setView("table")}
                  >
                    <ListFilter size={15} />
                  </button>
                  <button
                    type="button"
                    className={view === "grid" ? "active" : ""}
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>
              </div>
            </div>
            {view === "table" ? (
              <MarketTable
                instruments={data}
                onSelect={symbol =>
                  setLocation(`/stocks/${symbol.toLowerCase()}`)
                }
              />
            ) : (
              <div className="market-grid-view">
                {data.map(item => (
                  <button
                    type="button"
                    className="market-grid-card"
                    key={item.symbol}
                    onClick={() =>
                      setLocation(`/stocks/${item.symbol.toLowerCase()}`)
                    }
                  >
                    <div className="asset-cell">
                      <div
                        className={cn("asset-mark", `asset-${item.category}`)}
                      >
                        {item.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <strong>{item.symbol}</strong>
                        <span>{item.name}</span>
                      </div>
                    </div>
                    <strong className="grid-price">
                      {item.price.toLocaleString(undefined, {
                        maximumFractionDigits: item.price < 10 ? 4 : 2,
                      })}
                    </strong>
                    <span
                      className={item.changePct >= 0 ? "positive" : "negative"}
                    >
                      {item.changePct >= 0 ? "+" : ""}
                      {item.changePct.toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
          <aside className="market-side-rail">
            <div className="section-card side-card">
              <span className="section-eyebrow">Market breadth</span>
              <h3>Risk appetite is constructive</h3>
              <div className="breadth-meter">
                <span style={{ width: "68%" }} />
              </div>
              <div className="breadth-labels">
                <span>
                  <i className="positive-dot" /> 68% advancing
                </span>
                <span>
                  <i className="negative-dot" /> 32% declining
                </span>
              </div>
              <p>
                Participation is broadening beyond the largest technology names.
              </p>
            </div>
            <div className="section-card side-card">
              <span className="section-eyebrow">Shortcuts</span>
              <div className="shortcut-list">
                <button type="button" onClick={() => setLocation("/watchlist")}>
                  <span className="shortcut-icon teal">
                    <StarIcon />
                  </span>
                  Build a watchlist
                </button>
                <button type="button" onClick={() => setLocation("/charts")}>
                  <span className="shortcut-icon violet">
                    <ChartIcon />
                  </span>
                  Open chart workspace
                </button>
                <button type="button" onClick={() => setLocation("/calendar")}>
                  <span className="shortcut-icon amber">
                    <CalendarIcon />
                  </span>
                  Review today&apos;s events
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function StarIcon() {
  return <span>☆</span>;
}
function ChartIcon() {
  return <span>↗</span>;
}
function CalendarIcon() {
  return <span>▦</span>;
}
