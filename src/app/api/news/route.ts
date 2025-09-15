import Parser from "rss-parser";
import { NEWS_CONFIG, discoverFeedsForTopic, getFallbackFeeds } from "@/lib/config";
import { createHeartbeatCache, getGlobalHeartbeatCache, setGlobalHeartbeatCache } from "@/lib/heartbeat";

type FeedItem = {
  title: string;
  link: string;
  isoDate?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
};

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
};

const parser = new Parser<unknown, FeedItem>({ timeout: 15_000 });

// Disable ISR here; rely on our heartbeat cache based on NEWS_CONFIG.cacheTime
export const revalidate = 0;

type NewsPayload = {
  topic: string;
  items: NewsItem[];
  totalFeeds: number;
  lastUpdated: string;
  feedDiscoveryMethod?: string;
};

async function fetchNewsUpstream(topic: string): Promise<NewsPayload> {
  // Dynamically discover feeds for the topic
  let rssUrls: Array<{ url: string; source: string }> = [];

  try {
    rssUrls = await discoverFeedsForTopic(topic);
  } catch (error) {
    console.error("Feed discovery failed, using fallback feeds:", error);
    rssUrls = getFallbackFeeds();
  }

  if (rssUrls.length === 0) {
    rssUrls = getFallbackFeeds();
  }

  const results = await Promise.all(
    rssUrls.map(async ({ url, source }) => {
      try {
        const feed = await parser.parseURL(url);
        const items: NewsItem[] = (feed.items || [])
          .filter((item) => {
            if (!item.title) return false;

            const title = item.title.toLowerCase();
            const content = (item.contentSnippet || item.content || "").toLowerCase();
            const searchText = `${title} ${content}`;

            // Enhanced topic matching for better compatibility
            const normalizedTopic = topic.toLowerCase();
            const topicWords = normalizedTopic.split(/\s+/).filter((word) => word.length > 2);

            const hasTopicMatch = topicWords.some((word) => searchText.includes(word));

            if (normalizedTopic.includes("gaming") || normalizedTopic.includes("game")) {
              const gamingTerms = [
                "game",
                "gaming",
                "console",
                "pc",
                "mobile",
                "indie",
                "studio",
                "developer",
                "release",
                "update",
                "patch",
                "dlc",
                "expansion",
                "sequel",
                "remake",
                "remaster",
                "beta",
                "alpha",
                "early access",
                "steam",
                "playstation",
                "xbox",
                "nintendo",
                "switch",
                "ps5",
                "xbox series",
                "pc gaming",
                "vr",
                "virtual reality",
                "streaming",
                "twitch",
                "youtube gaming",
              ];
              const hasGamingMatch = gamingTerms.some((term) => searchText.includes(term));
              if (hasGamingMatch) return true;
            }

            if (hasTopicMatch) return true;
            return Math.random() < 0.3;
          })
          .slice(0, NEWS_CONFIG.maxItemsPerFeed)
          .map((item, idx) => ({
            id: `${source}-${idx}-${item.link ?? item.title}`,
            title: item.title || "Untitled",
            url: item.link ?? "#",
            source,
            publishedAt: item.isoDate ?? item.pubDate,
          }));
        return items;
      } catch (error) {
        console.error(`Error fetching from ${source}:`, error);
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
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const topicLower = topic.toLowerCase();

    const aExactMatch = aTitle.includes(topicLower);
    const bExactMatch = bTitle.includes(topicLower);

    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;

    const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return db - da;
  });

  const topArticles = unique.slice(0, 100);

  return {
    topic,
    items: topArticles,
    totalFeeds: rssUrls.length,
    lastUpdated: new Date().toISOString(),
    feedDiscoveryMethod: rssUrls.length > 0 ? "dynamic" : "fallback",
  };
}

function getCacheForTopic(topic: string) {
  const key = `news.v1:${topic.toLowerCase()}`;
  const existing = getGlobalHeartbeatCache<NewsPayload>(key);
  if (existing) return existing;
  const cache = createHeartbeatCache<NewsPayload>(
    async () => await fetchNewsUpstream(topic),
    {
      ttlMs: Math.max(NEWS_CONFIG.cacheTime, 60) * 1000, // at least 60s
      minHeartbeatMs: Math.min(NEWS_CONFIG.refreshInterval, 45_000),
      maxRefreshMs: 25_000,
    }
  );
  setGlobalHeartbeatCache(key, cache);
  return cache;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawTopic = (searchParams.get("topic") || "").trim();
  const topic = rawTopic || NEWS_CONFIG.topic;

  const cache = getCacheForTopic(topic);
  const state = await cache.get(true);

  if (!state.value) {
    const refreshed = await cache.forceRefresh();
    if (refreshed.value) {
      return Response.json(refreshed.value);
    }
    return Response.json({ topic, items: [], totalFeeds: 0, lastUpdated: new Date().toISOString(), feedDiscoveryMethod: "fallback" });
  }

  return Response.json(state.value);
}


