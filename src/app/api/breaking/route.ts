import Parser from "rss-parser";

type FeedItem = {
  title: string;
  link: string;
  isoDate?: string;
  pubDate?: string;
};

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
};

const parser = new Parser<unknown, FeedItem>({ timeout: 15_000 });

export const revalidate = 120;

const BREAKING_FEEDS: Array<{ url: string; source: string }> = [
  { url: "https://feedx.net/rss/ap.xml", source: "AP" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World" },
  { url: "https://www.euronews.com/rss", source: "Euronews" },
  { url: "https://www.lemonde.fr/en/rss/une.xml", source: "Le Monde" },
  { url: "https://time.com/feed/", source: "TIME" },
];

export async function GET() {
  const results = await Promise.all(
    BREAKING_FEEDS.map(async ({ url, source }) => {
      try {
        const feed = await parser.parseURL(url);
        const items: NewsItem[] = (feed.items || [])
          .filter((item) => !!item.title)
          .slice(0, 25)
          .map((item, idx) => ({
            id: `${source}-${idx}-${item.link ?? item.title}`,
            title: item.title || "Untitled",
            url: item.link ?? "#",
            source,
            publishedAt: item.isoDate ?? item.pubDate,
          }));
        return items;
      } catch {
        return [] as NewsItem[];
      }
    })
  );

  const merged = results.flat();
  const seen = new Set<string>();
  const unique = merged.filter((n) => {
    const key = `${n.source}:${n.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => {
    const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return db - da;
  });

  return Response.json({
    items: unique.slice(0, 150),
    totalFeeds: BREAKING_FEEDS.length,
    lastUpdated: new Date().toISOString(),
  });
}


