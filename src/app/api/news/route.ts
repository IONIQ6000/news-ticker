import Parser from "rss-parser";
import { NEWS_CONFIG, discoverFeedsForTopic, getFallbackFeeds } from "@/lib/config";

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

export const revalidate = NEWS_CONFIG.cacheTime;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawTopic = (searchParams.get("topic") || "").trim();
  const topic = rawTopic || NEWS_CONFIG.topic;
  
  // Dynamically discover feeds for the topic
  let rssUrls: Array<{url: string, source: string}> = [];
  
  try {
    console.log(`Discovering feeds for topic: ${topic}`);
    rssUrls = await discoverFeedsForTopic(topic);
    console.log(`Discovered ${rssUrls.length} feeds for topic: ${topic}`);
  } catch (error) {
    console.error("Feed discovery failed, using fallback feeds:", error);
    rssUrls = getFallbackFeeds();
  }
  
  // If no feeds were discovered, use fallbacks
  if (rssUrls.length === 0) {
    console.log("No feeds discovered, using fallback feeds");
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
            const topicWords = normalizedTopic.split(/\s+/).filter(word => word.length > 2);
            
            // Check if any topic word appears in the content
            const hasTopicMatch = topicWords.some(word => 
              searchText.includes(word)
            );
            
            // For gaming topics, also check for related terms
            if (normalizedTopic.includes("gaming") || normalizedTopic.includes("game")) {
              const gamingTerms = ["game", "gaming", "console", "pc", "mobile", "indie", "studio", "developer", "release", "update", "patch", "dlc", "expansion", "sequel", "remake", "remaster", "beta", "alpha", "early access", "steam", "playstation", "xbox", "nintendo", "switch", "ps5", "xbox series", "pc gaming", "vr", "virtual reality", "streaming", "twitch", "youtube gaming"];
              const hasGamingMatch = gamingTerms.some(term => searchText.includes(term));
              if (hasGamingMatch) return true;
            }
            
            // If topic words found, include the item
            if (hasTopicMatch) return true;
            
            // For broader coverage, include some general news items even without topic match
            // This ensures we always have content while prioritizing topic-relevant items
            return Math.random() < 0.3; // Include 30% of non-matching items for variety
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

  // Sort by relevance and popularity, then take top articles for consistent ticker speed
  unique.sort((a, b) => {
    // First priority: topic relevance (exact matches first)
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const topicLower = topic.toLowerCase();
    
    const aExactMatch = aTitle.includes(topicLower);
    const bExactMatch = bTitle.includes(topicLower);
    
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    
    // Second priority: recency (newer articles first)
    const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return db - da;
  });

  // Take top articles to ensure consistent ticker speed
  const topArticles = unique.slice(0, 100);

  return Response.json({
    topic,
    items: topArticles,
    totalFeeds: rssUrls.length,
    lastUpdated: new Date().toISOString(),
    feedDiscoveryMethod: rssUrls.length > 0 ? "dynamic" : "fallback"
  });
}


