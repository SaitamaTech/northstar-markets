import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

function StoryLink({
  item,
  children,
}: {
  item: { id: string; url?: string };
  children: React.ReactNode;
}) {
  if (item.url)
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="article-card"
      >
        {children}
      </a>
    );
  return (
    <Link href={`/news/article/${item.id}`} className="article-card">
      {children}
    </Link>
  );
}

export default function ResearchPage({
  mode = "news",
}: {
  mode?: "news" | "analysis";
}) {
  const [active, setActive] = useState("All stories");
  const [search, setSearch] = useState("");
  const query = trpc.market.news.useQuery(undefined, { staleTime: 60_000 });
  const filters =
    mode === "analysis"
      ? ["All stories", "Market analysis", "Technical", "Fundamentals", "Macro"]
      : ["All stories", "Markets", "Stocks", "Crypto", "Economy"];
  const articles = (query.data ?? []).filter(item => `${item.headline} ${item.category} ${item.source}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <AppShell>
      <div className="page-shell feature-shell research-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Northstar</span>
              <span>/</span>
              <strong>{mode === "analysis" ? "Analysis" : "News"}</strong>
            </div>
            <h1>
              {mode === "analysis" ? "The signal desk" : "Market intelligence"}
            </h1>
            <p>
              {mode === "analysis"
                ? "Independent frameworks for understanding price, fundamentals, and the macro regime."
                : "A focused feed of the stories, data, and context moving global markets."}
            </p>
          </div>
          <div className="heading-actions">
            <span className="data-asof">
              <span className="live-dot" /> Updated continuously
            </span>
            <button type="button" className="button button-secondary button-sm" onClick={() => notify("Reading list is ready for your saved stories.", "success")}>
              <BookOpen size={14} /> Reading list
            </button>
          </div>
        </div>
        <div className="category-nav research-tabs">
          {filters.map(filter => (
            <button
              type="button"
              key={filter}
              className={cn("category-pill", active === filter && "active")}
              onClick={() => setActive(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="research-grid">
          <main>
            <section className="featured-story">
              <div className="featured-visual">
                <Sparkles size={28} />
                <span>THE NORTHSTAR BRIEF</span>
              </div>
              <div className="featured-copy">
                <span className="news-meta">
                  <b>FEATURED {mode === "analysis" ? "ANALYSIS" : "MARKETS"}</b>
                  <span>·</span>12 min read
                </span>
                <h2>
                  {mode === "analysis"
                    ? "The narrow market is widening — what breadth says about the next move"
                    : "Equities find a bid as softer inflation data resets rate expectations"}
                </h2>
                <p>
                  When the headline tape gets loud, the useful signal often sits
                  one layer below it. Our desk breaks down what changed, what
                  did not, and the questions to carry into the next session.
                </p>
                <Link
                  href="/news/article/northstar-brief"
                  className="button button-primary button-sm"
                >
                  Read the brief <ArrowUpRight size={14} />
                </Link>
              </div>
            </section>
            <div className="research-toolbar">
              <div className="table-search">
                <Search size={15} />
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search stories" />
              </div>
              <button
                type="button"
                className="button button-secondary button-sm"
                onClick={() => setSearch(active === "All stories" ? "" : active.replace(" stories", ""))}
              >
                <Filter size={14} /> Filter
              </button>
            </div>
            <div className="article-list">
              {articles.map(item => (
                <StoryLink item={item} key={item.id}>
                  <div className={cn("article-image", `news-${item.tone}`)}>
                    <Sparkles size={18} />
                  </div>
                  <div className="article-content">
                    <span className="news-meta">
                      <b>{item.category}</b>
                      <span>·</span>
                      {item.source}
                    </span>
                    <h3>{item.headline}</h3>
                    <p>
                      Market context, key levels, and the data points worth
                      watching in the next session.
                    </p>
                    <div className="article-byline">
                      <Clock3 size={13} />
                      {item.time} <span>·</span>
                      {item.readTime}
                      <ArrowUpRight className="article-arrow" size={15} />
                    </div>
                  </div>
                </StoryLink>
              ))}
            </div>
          </main>
          <aside className="research-rail">
            <section className="section-card rail-card">
              <span className="section-eyebrow">Most read</span>
              <h3>What the desk is watching</h3>
              {[
                "AI capex: the second derivative matters",
                "Rates volatility is back in the room",
                "Three charts for the new oil regime",
                "The quiet return of small caps",
              ].map((title, index) => (
                <div className="most-read-row" key={title}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>
                    {title}
                    <small>{4 + index * 2} min read</small>
                  </span>
                </div>
              ))}
            </section>
            <section className="section-card rail-card newsletter-card">
              <div className="newsletter-icon">
                <Sparkles size={18} />
              </div>
              <h3>Start with the close</h3>
              <p>
                A short daily briefing on what moved, why it mattered, and what
                is next.
              </p>
              <button
                type="button"
                className="button button-primary full-button"
              >
                Join the briefing
              </button>
              <small>No noise. Unsubscribe anytime.</small>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
