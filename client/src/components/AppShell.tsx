import { Bell, CheckCheck, ChevronDown, Command, Moon, Search, Settings, Sun, Trash2, UserRound, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { SupabaseAuthDialog } from "@/components/SupabaseAuthDialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const primaryNav = [
  { label: "Markets", href: "/markets" },
  { label: "News", href: "/news" },
  { label: "Analysis", href: "/analysis" },
  { label: "Charts", href: "/charts" },
  { label: "Screener", href: "/screener" },
  { label: "Calendar", href: "/calendar" },
];

const mobileNav = [
  { label: "Overview", href: "/", icon: "⌂" },
  { label: "Markets", href: "/markets", icon: "◌" },
  { label: "Watchlist", href: "/watchlist", icon: "☆" },
  { label: "Portfolio", href: "/portfolio", icon: "◒" },
];

type NotificationItem = {
  id: number;
  title: string;
  detail: string;
  time: string;
  tone: "positive" | "neutral";
  read: boolean;
};

const initialNotifications: NotificationItem[] = [
  { id: 1, title: "Markets are open", detail: "Live market coverage is active.", time: "Now", tone: "positive", read: false },
  { id: 2, title: "Bitcoin moved higher", detail: "BTC is up 1.90% over the last 24 hours.", time: "12 min ago", tone: "positive", read: false },
  { id: 3, title: "Calendar updated", detail: "New macro events are available to review.", time: "1 hr ago", tone: "neutral", read: true },
];

export function BrandMark() {
  return <span className="brand-mark"><span className="brand-mark-core" /><span className="brand-mark-line" /><span className="brand-mark-dot" /></span>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const instrumentsQuery = trpc.market.instruments.useQuery(undefined, { staleTime: 60_000 });
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const normalized = query.toLowerCase();
    return (instrumentsQuery.data ?? []).filter((item) => item.symbol.toLowerCase().includes(normalized) || item.name.toLowerCase().includes(normalized)).slice(0, 5);
  }, [instrumentsQuery.data, query]);

  const handleAccountClick = async () => {
    if (user) {
      await logout();
    } else {
      setAuthOpen(true);
    }
  };

  const unreadCount = notifications.filter(item => !item.read).length;

  return (
    <>
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand-lockup" aria-label="Northstar Markets home">
            <BrandMark />
            <span className="brand-name">northstar<span>markets</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {primaryNav.map((item) => <Link key={item.href} href={item.href} className={cn("nav-link", location === item.href && "active")}>{item.label}</Link>)}
            <div className="more-nav-wrap"><button type="button" className="nav-link more-link" onClick={() => setMoreOpen(open => !open)} aria-expanded={moreOpen}><span>More</span><ChevronDown size={13} /></button>{moreOpen && <div className="more-menu"><Link href="/watchlist" onClick={() => setMoreOpen(false)}>Watchlists</Link><Link href="/portfolio" onClick={() => setMoreOpen(false)}>Portfolio</Link><Link href="/calendar" onClick={() => setMoreOpen(false)}>Calendar</Link><Link href="/deposit/eth" onClick={() => setMoreOpen(false)}>Deposit ETH</Link><Link href="/deposits" onClick={() => setMoreOpen(false)}>Deposit history</Link>{user && <Link href="/settings" onClick={() => setMoreOpen(false)}><Settings size={13} /> Settings</Link>}</div>}</div>
          </nav>
          <div className="topbar-actions">
            <div className={cn("global-search", searchOpen && "expanded")}>
              <Search size={16} />
              <input aria-label="Search markets" placeholder="Search markets" value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") { setQuery(""); setSearchOpen(false); } }} />
              {query ? <button type="button" className="search-clear" onClick={() => setQuery("")}><X size={14} /></button> : <kbd><Command size={10} /> K</kbd>}
              {searchOpen && query && <div className="search-results">
                {filtered.length > 0 ? filtered.map((item) => <Link key={item.symbol} href={`/stocks/${item.symbol.toLowerCase()}`} className="search-result" onClick={() => { setQuery(""); setSearchOpen(false); }}><span className={cn("asset-mark tiny", `asset-${item.category}`)}>{item.symbol.slice(0, 2)}</span><span><strong>{item.symbol}</strong><small>{item.name}</small></span><b className={item.changePct >= 0 ? "positive" : "negative"}>{item.changePct >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%</b></Link>) : <div className="search-empty">No matching instrument found.</div>}
              </div>}
            </div>
            {user && <div className="notification-center"><button type="button" className="icon-button top-icon" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(open => !open)}><Bell size={17} />{unreadCount > 0 && <span className="notification-dot" />}</button>{notificationsOpen && <div className="notification-panel"><div className="notification-panel-head"><div><strong>Notifications</strong><small>{unreadCount ? `${unreadCount} unread` : "All caught up"}</small></div><div className="notification-panel-actions"><button type="button" aria-label="Mark all notifications as read" title="Mark all as read" onClick={() => setNotifications(current => current.map(item => ({ ...item, read: true })))}><CheckCheck size={15} /></button><button type="button" aria-label="Clear notifications" title="Clear notifications" onClick={() => setNotifications([])}><Trash2 size={14} /></button></div></div>{notifications.length ? <div className="notification-list">{notifications.map(item => <button type="button" className={cn("notification-item", !item.read && "unread")} key={item.id} onClick={() => setNotifications(current => current.map(notification => notification.id === item.id ? { ...notification, read: true } : notification))}><span className={cn("notification-indicator", item.tone)} /><span className="notification-copy"><strong>{item.title}</strong><small>{item.detail}</small><em>{item.time}</em></span></button>)}</div> : <div className="notification-empty"><Bell size={18} /><span>No notifications yet</span></div>}</div>}</div>}
            <button type="button" className="icon-button top-icon theme-toggle" aria-label="Toggle theme" onClick={toggleTheme}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button type="button" className="avatar-button" aria-label={user ? "Sign out" : "Account"} onClick={handleAccountClick}>{user ? (user.email ?? "I").slice(0, 1).toUpperCase() : <UserRound size={16} />}</button>
            <button type="button" className="login-button" onClick={handleAccountClick}>{user ? "Sign out" : "Sign in"}</button>
          </div>
        </div>
      </header>
      <div className="market-ticker" aria-label="Market ticker">
        <div className="ticker-track"><span className="ticker-live"><Zap size={12} fill="currentColor" /> Live tape</span><span> S&amp;P 500 <b className="positive">+0.54%</b></span><span> Nasdaq 100 <b className="positive">+0.73%</b></span><span> Bitcoin <b className="positive">+1.90%</b></span><span> Gold <b className="positive">+0.45%</b></span><span> EUR/USD <b className="positive">+0.14%</b></span><span> US 10Y <b className="negative">-3.2 bps</b></span></div>
      </div>
      <main>{children}</main>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mobileNav.map((item) => <Link key={item.href} href={item.href} className={cn("mobile-nav-item", location === item.href && "active")}><span>{item.icon}</span>{item.label}</Link>)}
        <button type="button" className="mobile-nav-item" onClick={() => setSearchOpen(true)}><span>⌕</span>Search</button>
      </nav>
    </div>
    <SupabaseAuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
