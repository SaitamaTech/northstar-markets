import { ArrowRight, ChevronDown, Clock3, Globe2, LayoutGrid, Plus, RefreshCw, ShieldCheck, SlidersHorizontal, Sparkles, TrendingUp, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { MarketChart } from "@/components/market/MarketChart";
import { MarketTable } from "@/components/market/MarketTable";
import { MiniSparkline } from "@/components/market/MiniSparkline";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

const moverTabs = ["Top gainers", "Top losers", "Most active"];

function SectionHeader({ eyebrow, title, action, icon }: { eyebrow?: string; title: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return <div className="section-header"><div>{eyebrow && <span className="section-eyebrow">{eyebrow}</span>}<h2>{icon}{title}</h2></div>{action}</div>;
}

function Change({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return <span className={cn("change-inline", positive ? "positive" : "negative")}>{positive ? "+" : ""}{value.toFixed(2)}{suffix}</span>;
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { displayName, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSymbol, setSelectedSymbol] = useState("NVDA");
  const [moverTab, setMoverTab] = useState(moverTabs[0]);
  const overviewQuery = trpc.market.overview.useQuery(undefined, { staleTime: 60_000 });
  const instrumentsQuery = trpc.market.instruments.useQuery(undefined, { staleTime: 60_000 });
  const newsQuery = trpc.market.news.useQuery(undefined, { staleTime: 60_000 });
  const eventsQuery = trpc.market.events.useQuery(undefined, { staleTime: 60_000 });
  const selectedQuery = trpc.market.instrument.useQuery({ symbol: selectedSymbol }, { staleTime: 60_000 });
  const chartQuery = trpc.market.chart.useQuery({ symbol: selectedSymbol }, { staleTime: 60_000 });
  const portfolioQuery = trpc.portfolio.summary.useQuery(undefined, { staleTime: 30_000, enabled: isAuthenticated });
  const portfolio = portfolioQuery.data;
  const refresh = () => { void Promise.all([overviewQuery.refetch(), instrumentsQuery.refetch(), newsQuery.refetch(), eventsQuery.refetch(), selectedQuery.refetch(), chartQuery.refetch(), portfolioQuery.refetch()]); };
  const instruments = instrumentsQuery.data ?? [];
  const selected = selectedQuery.data ?? instruments.find((item) => item.symbol === selectedSymbol) ?? instruments[0];
  const greeting = getTimeGreeting();
  const movers = useMemo(() => {
    if (moverTab === "Top losers") return [...instruments].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
    if (moverTab === "Most active") return [...instruments].sort((a, b) => Number(b.volume.replace(/[^0-9.]/g, "")) - Number(a.volume.replace(/[^0-9.]/g, ""))).slice(0, 5);
    return [...instruments].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  }, [instruments, moverTab]);

  return (
    <AppShell>
      <div className="page-shell home-shell">
        <div className="workspace-heading">
          <div><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Global markets</strong></div><h1>{greeting}{displayName ? `, ${displayName}` : ""}<span className="heading-period">.</span></h1><p>Markets are open. Here is your concise read on what is moving now.</p></div>
          <div className="heading-actions"><span className="data-asof"><span className="live-dot" /> Data as of {new Date().toLocaleTimeString()}</span><button type="button" className="button button-secondary button-sm" onClick={refresh}><RefreshCw size={14} /> Refresh</button></div>
        </div>

        <section className="overview-grid">
          <div className="section-card market-board">
            <SectionHeader eyebrow="Global pulse" title="Market overview" action={<Link href="/markets" className="text-button">View all markets <ArrowRight size={14} /></Link>} />
            <div className="index-strip">{(overviewQuery.data ?? []).map((item) => <button type="button" key={item.symbol} className="index-card" onClick={() => setSelectedSymbol(item.symbol === "SPX" ? "VOO" : item.symbol === "NDX" ? "NVDA" : "AAPL")}><div className="index-card-top"><span>{item.name}</span><span className={cn("status-dot", item.status === "Open" ? "open" : "closed")} /></div><strong>{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong><div><Change value={item.changePct} /><span className="index-change">{item.change > 0 ? "+" : ""}{item.change.toFixed(2)}</span></div><MiniSparkline values={[item.price - 45, item.price - 22, item.price - 36, item.price - 28, item.price - 16, item.price - 18, item.price]} positive={item.changePct >= 0} width={72} height={22} /></button>)}</div>
          </div>
          <div className="section-card watch-card">
            <SectionHeader eyebrow="Personalized" title="Your board" action={<Link href="/portfolio" className="icon-button" aria-label="Open portfolio"><SlidersHorizontal size={15} /></Link>} />
            <div className="board-value-row"><div><span className="metric-label">Portfolio value</span><strong className="board-value">{portfolio ? `$${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Sign in to connect"}</strong><div>{portfolio && <><Change value={portfolio.profitPercentage} /> <span className="muted">return</span></>}</div>{portfolio && <small className="muted">₿ {(portfolio.btcBalance ?? 0).toFixed(8)} available</small>}</div><div className="board-orbit"><WalletCards size={20} /></div></div>
            <div className="board-chart"><MiniSparkline values={[92, 94, 91, 96, 95, 100, 104, 103, 109, 111, 116, 114, 121, 126]} width={240} height={48} /></div>
            <div className="section-card" style={{ padding: "16px", border: "1px solid rgba(94,234,212,.2)", background: "linear-gradient(135deg, rgba(94,234,212,.08), rgba(15,23,42,.15))" }}>
              <span className="section-eyebrow">Put Your Crypto to Work</span>
              <h3 style={{ margin: "8px 0 6px", fontSize: "18px" }}>Earn returns on eligible crypto balances.</h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "12px" }}>Start with as little as $100 and track your daily accrual from one dashboard.</p>
              <div style={{ marginTop: 12 }}><Link href="/investments" className="button button-primary button-sm">Explore investments</Link></div>
            </div>
            <div className="allocation-row"><div className="allocation-donut"><span>8</span><small>assets</small></div><div className="allocation-bars"><div><span><i className="allocation-dot teal" />Equities</span><b>62%</b></div><div><span><i className="allocation-dot violet" />Digital assets</span><b>23%</b></div><div><span><i className="allocation-dot amber" />Cash &amp; bonds</span><b>15%</b></div></div></div>
            <div className="card-links"><Link href="/portfolio" className="card-link">Open portfolio <ArrowRight size={14} /></Link><Link href="/investments" className="card-link">Explore investments <ArrowRight size={14} /></Link></div>
          </div>
        </section>

        <section className="section-card chart-card">
          <SectionHeader eyebrow="Focus instrument" title={selected ? `${selected.name} · ${selected.symbol}` : "Loading instrument"} action={<div className="chart-header-actions"><button type="button" className="select-button" onClick={() => setLocation("/markets")}><Globe2 size={14} /> Markets <ChevronDown size={13} /></button><button type="button" className="button button-primary button-sm" onClick={() => setLocation(`/stocks/${selected?.symbol.toLowerCase() ?? "nvda"}`)}><Plus size={14} /> Add to watchlist</button></div>} />
          {selected && <div className="asset-quote-row"><div className="quote-main"><strong>{selected.price.toLocaleString(undefined, { minimumFractionDigits: selected.price < 10 ? 4 : 2, maximumFractionDigits: selected.price < 10 ? 4 : 2 })}</strong><Change value={selected.changePct} /><span className="quote-change">{selected.change > 0 ? "+" : ""}{selected.change.toFixed(selected.price < 10 ? 4 : 2)} today</span></div><div className="quote-stats"><span>Day range <b>{(selected.price * 0.972).toFixed(2)} — {(selected.price * 1.018).toFixed(2)}</b></span><span>Volume <b>{selected.volume}</b></span><span>Market cap <b>{selected.marketCap}</b></span></div></div>}
          {selected && <MarketChart instrument={selected} series={chartQuery.data ?? []} onCompare={() => setLocation("/charts")} />}
        </section>

        <section className="section-card movers-card">
          <SectionHeader eyebrow="Market action" title="Movers &amp; watchlist" action={<Link href="/markets" className="text-button">Full market table <ArrowRight size={14} /></Link>} />
          <div className="tab-row">{moverTabs.map((tab) => <button type="button" key={tab} className={cn("section-tab", moverTab === tab && "active")} onClick={() => setMoverTab(tab)}>{tab}</button>)}</div>
          <MarketTable instruments={movers} compact onSelect={(symbol) => { setSelectedSymbol(symbol); window.scrollTo({ top: 300, behavior: "smooth" }); }} />
        </section>

        <div className="lower-grid">
          <section className="section-card intelligence-card">
            <SectionHeader eyebrow="The signal desk" title="Latest intelligence" action={<Link href="/news" className="text-button">View all <ArrowRight size={14} /></Link>} />
            <div className="news-list">{(newsQuery.data ?? []).slice(0, 4).map((item) => { const content = <><div className={cn("news-thumb", `news-${item.tone}`)}><Sparkles size={16} /></div><div className="news-copy"><span className="news-meta"><b>{item.category}</b><span>·</span>{item.source}</span><h3>{item.headline}</h3><span className="news-time">{item.time} · {item.readTime}</span></div><ArrowRight className="news-arrow" size={15} /></>; return item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="news-row" key={item.id}>{content}</a> : <Link href={`/news/article/${item.id}`} className="news-row" key={item.id}>{content}</Link>; })}</div>
          </section>
          <section className="section-card events-card">
            <SectionHeader eyebrow="Macro calendar" title="Upcoming events" action={<Link href="/calendar" className="text-button">Calendar <ArrowRight size={14} /></Link>} />
            <div className="event-list">{(eventsQuery.data ?? []).slice(0, 4).map((event) => <div className="event-row" key={`${event.time}-${event.event}`}><div className="event-time">{event.time}<small>ET</small></div><div className="event-country"><span className="flag-chip">{event.flag}</span><span>{event.country}</span></div><div className="event-name"><strong>{event.event}</strong><span className={cn("importance", `importance-${event.importance}`)}>{event.importance}</span></div><div className="event-forecast"><span>Forecast</span><b>{event.forecast}</b></div></div>)}</div>
          </section>
        </div>

        <div className="reality-grid">
          <section className="section-card pulse-card">
            <SectionHeader eyebrow="Risk monitor" title="Macro pulse" action={<span className="data-asof"><span className="live-dot" /> Real-time</span>} />
            <div className="pulse-grid">
              <div className="pulse-metric positive">
                <span>Risk appetite</span>
                <strong>66 / 100</strong>
                <small>Risk-on bias improving</small>
              </div>
              <div className="pulse-metric neutral">
                <span>BTC dominance</span>
                <strong>56.1%</strong>
                <small>Up 0.8% today</small>
              </div>
              <div className="pulse-metric negative">
                <span>Volatility</span>
                <strong>18.4%</strong>
                <small>Elevated but stable</small>
              </div>
            </div>
            <div className="risk-meter-wrap">
              <div className="risk-meter-labels"><span>Cooling</span><span>Balanced</span><span>Risky</span></div>
              <div className="risk-meter"><span style={{ width: "66%" }} /></div>
            </div>
          </section>

          <section className="section-card execution-card">
            <SectionHeader eyebrow="Execution flow" title="Order book" action={<Link href="/portfolio" className="text-button">Portfolio <ArrowRight size={14} /></Link>} />
            <div className="order-feed">
              <div className="feed-row">
                <span className="feed-pill positive">Buy</span>
                <div><strong>BTC / USD</strong><small>Institutional sweep</small></div>
                <b>$68,420</b>
              </div>
              <div className="feed-row">
                <span className="feed-pill neutral">Hold</span>
                <div><strong>ETH / USD</strong><small>Range rotation</small></div>
                <b>$3,540</b>
              </div>
              <div className="feed-row">
                <span className="feed-pill negative">Sell</span>
                <div><strong>NVDA</strong><small>Profit-taking</small></div>
                <b>$130.42</b>
              </div>
            </div>
          </section>
        </div>

        <div className="workspace-footer"><span><ShieldCheck size={14} /> Market intelligence platform · Not financial advice</span><span>Quotes update automatically when the live provider is available.</span></div>
      </div>
    </AppShell>
  );
}
