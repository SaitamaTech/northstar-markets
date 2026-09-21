import type { NewsItem } from "@shared/market-data";

const INTELLIGENCE_FEED =
  "https://news.google.com/rss/search?q=(intelligence+OR+%22national+security%22+OR+geopolitics)+when%3A1d&hl=en-US&gl=US&ceid=US%3Aen";

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

function readTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function formatTime(value: string) {
  const published = new Date(value);
  if (Number.isNaN(published.getTime())) return "Just now";
  const minutes = Math.max(1, Math.floor((Date.now() - published.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function sourceFromTitle(title: string) {
  const separator = title.lastIndexOf(" - ");
  return separator > 0 ? title.slice(separator + 3).trim() : "Google News";
}

export async function fetchLiveNews(): Promise<NewsItem[]> {
  const response = await fetch(INTELLIGENCE_FEED, {
    headers: { "User-Agent": "Northstar Markets/1.0" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`News feed returned ${response.status}`);

  const xml = await response.text();
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi))
    .map(([, item], index) => {
      const rawTitle = readTag(item, "title");
      const headline = rawTitle.replace(/\s+-\s+[^-]+$/, "").trim();
      const source = sourceFromTitle(rawTitle);
      const url = readTag(item, "link");
      const published = readTag(item, "pubDate");
      return {
        id: `live-${index}-${Buffer.from(url).toString("base64url").slice(0, 12)}`,
        category: "INTELLIGENCE",
        headline: headline || rawTitle,
        source,
        time: formatTime(published),
        readTime: "Live source",
        tone: (["blue", "amber", "rose", "violet"] as const)[index % 4],
        url,
      } satisfies NewsItem;
    })
    .filter((item) => item.headline && item.url)
    .slice(0, 20);
}
