// Centralized configuration for the single-topic news ticker

type Feed = { url: string; source: string };

// Resolve the single topic from env or fallback
const TOPIC = (process.env.NEWS_TOPIC || "technology").trim();

// Curated feeds per supported topic
const TOPIC_FEEDS: Record<string, Feed[]> = {
  technology: [
    { url: "https://techcrunch.com/feed/", source: "TechCrunch" },
    { url: "https://www.theverge.com/rss/index.xml", source: "The Verge" },
    { url: "https://feeds.arstechnica.com/arstechnica/index", source: "Ars Technica" },
    { url: "https://www.wired.com/feed/rss", source: "WIRED" },
    { url: "http://feeds.bbci.co.uk/news/technology/rss.xml", source: "BBC Technology" },
    { url: "https://www.theguardian.com/uk/technology/rss", source: "The Guardian Tech" },
  ],
  business: [
    { url: "https://feeds.reuters.com/reuters/businessNews", source: "Reuters Business" },
    { url: "https://www.theguardian.com/uk/business/rss", source: "The Guardian Business" },
    { url: "http://feeds.bbci.co.uk/news/business/rss.xml", source: "BBC Business" },
    { url: "https://www.cnbc.com/id/10001147/device/rss/rss.html", source: "CNBC" },
  ],
  sports: [
    { url: "https://www.espn.com/espn/rss/news", source: "ESPN" },
    { url: "http://feeds.bbci.co.uk/sport/rss.xml", source: "BBC Sport" },
    { url: "https://www.skysports.com/rss/12040", source: "Sky Sports" },
    { url: "https://www.theguardian.com/uk/sport/rss", source: "The Guardian Sport" },
  ],
  politics: [
    { url: "https://www.reuters.com/politics/rss", source: "Reuters Politics" },
    { url: "http://feeds.bbci.co.uk/news/politics/rss.xml", source: "BBC Politics" },
    { url: "https://www.theguardian.com/politics/rss", source: "The Guardian Politics" },
  ],
  science: [
    { url: "https://www.sciencedaily.com/rss/top/science.xml", source: "ScienceDaily" },
    { url: "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Science" },
    { url: "https://www.theguardian.com/science/rss", source: "The Guardian Science" },
    { url: "https://www.scientificamerican.com/feed/", source: "Scientific American" },
  ],
  health: [
    { url: "http://feeds.bbci.co.uk/news/health/rss.xml", source: "BBC Health" },
    { url: "https://www.medicalnewstoday.com/rss", source: "Medical News Today" },
    { url: "https://www.webmd.com/rss/", source: "WebMD" },
    { url: "https://www.theguardian.com/society/health/rss", source: "The Guardian Health" },
  ],
};

export const VALID_TOPICS: string[] = Object.keys(TOPIC_FEEDS);

export function isValidTopic(topic: string | null | undefined): boolean {
  if (!topic) return false;
  const key = topic.toLowerCase().trim();
  return VALID_TOPICS.includes(key);
}

function sanitizeFeeds(feeds: Feed[]): Feed[] {
  // Remove obvious duplicates and invalid entries
  const seen = new Set<string>();
  return feeds.filter((f) => {
    if (!f.url || !f.source) return false;
    const key = `${f.source}:${f.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const NEWS_CONFIG = {
  // Single-topic setting
  topic: TOPIC,

  // RSS feed sources for the configured topic (used as fallback if discovery fails)
  feeds: sanitizeFeeds(TOPIC_FEEDS[TOPIC.toLowerCase()] || TOPIC_FEEDS["technology"]),

  // Max number of items to keep per feed during aggregation
  maxItemsPerFeed: 15,

  // Next.js route segment caching (in seconds)
  cacheTime: 60,

  // Client auto-refresh interval for the ticker (in milliseconds)
  refreshInterval: 60_000,

  // Breaking news alerts configuration for UI
  breakingAlerts: {
    enabled: true,
    sensitivity: "medium" as "low" | "medium" | "high",
    autoDismissMs: 25_000,
  },
};

// Dynamic feed discovery (simple strategy based on curated lists per topic)
// In a more advanced setup, this could call a discovery API or scrape well-known hubs.
export async function discoverFeedsForTopic(topic: string): Promise<Feed[]> {
  const key = (topic || "").toLowerCase().trim();
  const feeds = TOPIC_FEEDS[key];
  if (feeds && feeds.length > 0) {
    return sanitizeFeeds(feeds);
  }
  // Fallback to technology if topic is unknown
  return sanitizeFeeds(TOPIC_FEEDS["technology"]);
}

export function getFallbackFeeds(): Feed[] {
  return sanitizeFeeds(NEWS_CONFIG.feeds);
}


