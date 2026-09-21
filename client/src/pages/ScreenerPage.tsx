import {
  Check,
  ChevronDown,
  Download,
  Play,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MarketTable } from "@/components/market/MarketTable";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

const filterOptions = [
  { label: "Market cap", value: "> $10B" },
  { label: "P/E ratio", value: "< 35" },
  { label: "Revenue growth", value: "> 10%" },
  { label: "ROE", value: "> 15%" },
];

export default function ScreenerPage() {
  const [filters, setFilters] = useState(filterOptions);
  const [ran, setRan] = useState(false);
  const query = trpc.market.instruments.useQuery(
    { category: "stock" },
    { staleTime: 60_000 }
  );
  const data = useMemo(
    () => [...(query.data ?? [])].sort((a, b) => b.changePct - a.changePct),
    [query.data]
  );
  const saveScreen = () => {
    localStorage.setItem("northstar-screener", JSON.stringify(filters));
    notify("Screen saved locally.", "success");
  };
  return (
    <AppShell>
      <div className="page-shell feature-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Markets</span>
              <span>/</span>
              <strong>Screener</strong>
            </div>
            <h1>Find the signal</h1>
            <p>
              Combine fundamental and market filters to surface companies worth
              researching next.
            </p>
          </div>
          <div className="heading-actions">
            <button type="button" className="button button-secondary button-sm" onClick={saveScreen}>
              <Save size={14} /> Save screen
            </button>
            <button type="button" className="button button-primary button-sm" onClick={() => setRan(true)}>
              <Play size={14} /> {ran ? "Screen refreshed" : "Run screen"}
            </button>
          </div>
        </div>
        <div className="screener-layout">
          <aside className="section-card screener-sidebar">
            <div className="screener-sidebar-head">
              <div>
                <span className="section-eyebrow">Screen builder</span>
                <h2>Filters</h2>
              </div>
              <button
                type="button"
                className="icon-button subtle"
                onClick={() => setFilters([])}
              >
                <RotateCcw size={15} />
              </button>
            </div>
            <div className="filter-group">
              <label>Universe</label>
              <button type="button" className="filter-select" onClick={() => notify("Universe: US stocks") }>
                US stocks <ChevronDown size={14} />
              </button>
            </div>
            <div className="filter-group">
              <label>
                Active filters <span>{filters.length}</span>
              </label>
              {filters.map(filter => (
                <div className="filter-control" key={filter.label}>
                  <span>{filter.label}</span>
                  <b>{filter.value}</b>
                  <button
                    type="button"
                    onClick={() =>
                      setFilters(current =>
                        current.filter(item => item.label !== filter.label)
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-filter-button"
              onClick={() =>
                setFilters(current =>
                  current.length === filterOptions.length
                    ? current
                    : [...current, filterOptions[current.length]]
                )
              }
            >
              <Plus size={14} /> Add filter
            </button>
            <div className="saved-screens">
              <span className="section-eyebrow">Saved screens</span>
              <button type="button" onClick={() => { setFilters(filterOptions); setRan(true); }}>
                <span>
                  <Check size={13} /> Quality compounders
                </span>
                <small>12 results</small>
              </button>
              <button type="button" onClick={() => { setFilters(filterOptions.slice(1)); setRan(true); }}>
                <span>
                  <Check size={13} /> Momentum watch
                </span>
                <small>28 results</small>
              </button>
            </div>
          </aside>
          <main className="section-card screener-results">
            <div className="screener-results-head">
              <div>
                <span className="section-eyebrow">Results</span>
                <h2>
                  Quality momentum{" "}
                  <span className="result-count">{data.length} matches</span>
                </h2>
              </div>
              <div className="screener-result-actions">
                <button
                  type="button"
                  className="button button-secondary button-sm"
                >
                  <SlidersHorizontal size={14} /> Columns
                </button>
                <button
                  type="button"
                  className="button button-secondary button-sm"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>
            <div className="active-filter-row">
              {filters.map(filter => (
                <span key={filter.label} className="active-filter-chip">
                  {filter.label} {filter.value}
                  <button
                    type="button"
                    onClick={() =>
                      setFilters(current =>
                        current.filter(item => item.label !== filter.label)
                      )
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <MarketTable
              instruments={data}
              onSelect={symbol =>
                window.location.assign(`/stocks/${symbol.toLowerCase()}`)
              }
            />
          </main>
        </div>
      </div>
    </AppShell>
  );
}
