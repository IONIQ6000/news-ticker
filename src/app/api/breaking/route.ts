import Parser from "rss-parser";
import { createHeartbeatCache, getGlobalHeartbeatCache, setGlobalHeartbeatCache } from "@/lib/heartbeat";
import crypto from "crypto";

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

// Disable Next route-level ISR caching; rely on our heartbeat cache instead
export const revalidate = 0;

const BREAKING_FEEDS: Array<{ url: string; source: string }> = [
  { url: "https://feedx.net/rss/ap.xml", source: "AP" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World" },
  { url: "https://www.euronews.com/rss", source: "Euronews" },
  { url: "https://www.lemonde.fr/en/rss/une.xml", source: "Le Monde" },
  { url: "https://time.com/feed/", source: "TIME" },
];

type BreakingPayload = {
  items: NewsItem[];
  totalFeeds: number;
  lastUpdated: string;
};

async function fetchBreakingUpstream(): Promise<BreakingPayload> {
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

  return {
    items: unique.slice(0, 150),
    totalFeeds: BREAKING_FEEDS.length,
    lastUpdated: new Date().toISOString(),
  };
}

const CACHE_KEY = "breaking.v1";
function getCache() {
  const existing = getGlobalHeartbeatCache<BreakingPayload>(CACHE_KEY);
  if (existing) return existing;
  const cache = createHeartbeatCache<BreakingPayload>(
    async () => await fetchBreakingUpstream(),
    {
      // Serve cached responses for up to 3 minutes; refresh in background after TTL
      ttlMs: 180_000,
      // Ensure at least 90s between upstream refreshes even if many requests arrive
      minHeartbeatMs: 90_000,
      // Bound any single refresh duration
      maxRefreshMs: 20_000,
    }
  );
  setGlobalHeartbeatCache(CACHE_KEY, cache);
  return cache;
}

export async function GET(req: Request) {
  const cache = getCache();
  const state = await cache.get(true);

  const makeEtag = (p: BreakingPayload) => {
    const basis = p.items.map(i => `${i.source}:${i.title}`).join("|");
    return 'W/"' + crypto.createHash("sha1").update(basis).digest("hex") + '"';
  };

  const payload = state.value ?? (await cache.forceRefresh()).value;
  if (!payload) {
    const fallback = { items: [], totalFeeds: BREAKING_FEEDS.length, lastUpdated: new Date().toISOString() } satisfies BreakingPayload;
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  const etag = makeEtag(payload);

  // Conditional request handling – return 304 if unchanged
  try {
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          "ETag": etag,
          "Cache-Control": "public, max-age=60",
        },
      });
    }
  } catch {}

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "ETag": etag,
      // Encourage browser caching for short time to reduce calls from a single client
      "Cache-Control": "public, max-age=60",
    },
  });
}


