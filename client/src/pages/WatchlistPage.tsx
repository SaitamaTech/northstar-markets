import {
  Bell,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MarketTable } from "@/components/market/MarketTable";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

export default function WatchlistPage() {
  const groups = ["Core ideas", "AI infrastructure", "Macro", "Digital assets"];
  const [active, setActive] = useState("Core ideas");
  const [groupsState, setGroupsState] = useState(groups);
  const query = trpc.market.instruments.useQuery(undefined, {
    staleTime: 60_000,
  });
  const data =
    active === "Digital assets"
      ? (query.data ?? []).filter(item => item.category === "crypto")
      : active === "Macro"
        ? (query.data ?? []).filter(item =>
            ["GC", "EUR/USD", "VOO"].includes(item.symbol)
          )
        : (query.data ?? []).filter(item =>
            ["NVDA", "AAPL", "MSFT", "AMZN", "META", "TSLA"].includes(
              item.symbol
            )
          );
  return (
    <AppShell>
      <div className="page-shell feature-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span>/</span>
              <strong>Watchlists</strong>
            </div>
            <h1>Watchlist studio</h1>
            <p>
              Keep the names, themes, and price levels that deserve your
              attention close at hand.
            </p>
          </div>
          <div className="heading-actions">
            <button type="button" className="button button-primary button-sm" onClick={() => setGroupsState(current => [...current, `New list ${current.length + 1}`])}>
              <Plus size={14} /> New watchlist
            </button>
          </div>
        </div>
        <div className="watchlist-layout">
          <aside className="watchlist-sidebar section-card">
            <div className="watchlist-sidebar-head">
              <span className="section-eyebrow">Your lists</span>
              <button type="button" className="icon-button subtle" onClick={() => setGroupsState(current => [...current, `New list ${current.length + 1}`])}>
                <Plus size={15} />
              </button>
            </div>
            {groupsState.map((group, index) => (
              <button
                type="button"
                className={cn("watchlist-group", active === group && "active")}
                key={group}
                onClick={() => setActive(group)}
              >
                <span className="watchlist-star">
                  <Star
                    size={14}
                    fill={index === 0 ? "currentColor" : "none"}
                  />
                </span>
                <span>{group}</span>
                <small>
                  {index === 0 ? 6 : index === 1 ? 4 : index === 2 ? 3 : 2}
                </small>
              </button>
            ))}
            <div className="watchlist-sidebar-foot">
              <button type="button" onClick={() => setGroupsState(current => current.slice(0, 1))}>
                <Trash2 size={14} /> Manage lists
              </button>
            </div>
          </aside>
          <section className="section-card watchlist-main">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Saved view</span>
                <h2>
                  {active}
                  <span className="result-count">{data.length} assets</span>
                </h2>
              </div>
              <div className="watchlist-actions">
                <button type="button" className="select-button" onClick={() => notify("Price alerts require an alert delivery provider before activation.")}>
                  <Bell size={14} /> Alerts <ChevronDown size={13} />
                </button>
                <button type="button" className="icon-button bordered" onClick={() => notify("Watchlist options opened.")}>
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
            <div className="watchlist-summary">
              <span>
                <i className="status-dot open" /> Open session
              </span>
              <span>
                Avg. move <b className="positive">+1.12%</b>
              </span>
              <span>Last refreshed 14:32 ET</span>
            </div>
            <MarketTable
              instruments={data}
              onSelect={symbol =>
                window.location.assign(`/stocks/${symbol.toLowerCase()}`)
              }
            />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
