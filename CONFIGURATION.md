# Configuration Guide

## Setting Your Single News Topic

The News Ticker is designed to focus on **one topic only**. Here are the ways to configure it:

### Method 1: Environment Variable (Recommended)

Create a `.env.local` file in your project root:

```bash
# .env.local
NEWS_TOPIC=technology
```

Then restart your development server:
```bash
npm run dev
```

### Method 2: Direct Configuration Edit

Edit `src/lib/config.ts` and change the topic:

```typescript
export const NEWS_CONFIG = {
  topic: "business", // Change this line to your preferred topic
  // ... rest of config
};
```

### Method 3: Command Line

Set the environment variable before starting the server:

```bash
# For technology news
export NEWS_TOPIC=technology && npm run dev

# For business news
export NEWS_TOPIC=business && npm run dev

# For sports news
export NEWS_TOPIC=sports && npm run dev
```

## Available Topics

The ticker is designed for **one topic only**. Choose from:

| Topic | Description | Example RSS Sources |
|-------|-------------|---------------------|
| `technology` | Tech industry news | TechCrunch, The Verge, Ars Technica, Wired, Engadget |
| `business` | Business and finance | Reuters Business, Bloomberg, Financial Times, Entrepreneur, Inc. |
| `sports` | Sports news | BBC Sport, ESPN, Sporting News, Sky Sports, Goal.com |
| `politics` | Political news | BBC Politics, Reuters Politics, Politico, RealClearPolitics, The Hill |
| `science` | Scientific discoveries | Nature, Science, Scientific American, New Scientist, Discover |
| `health` | Health and medical | WebMD, Healthline, Medical News Today, Mayo Clinic, HealthDay |

## Customizing RSS Feeds

Since you're focusing on **one topic**, you can customize the RSS feeds in `src/lib/config.ts` to match your chosen topic:

```typescript
feeds: [
  // Replace these with feeds that match your topic
  { url: "https://your-topic-specific-site.com/rss", source: "Your Source" },
  { url: "https://another-topic-site.com/feed", source: "Another Source" },
  { url: "https://third-topic-site.com/rss", source: "Third Source" },
],
```

## Performance Tuning

You can adjust these settings in `src/lib/config.ts`:

```typescript
export const NEWS_CONFIG = {
  // ... other config
  maxItemsPerFeed: 15,        // Max items per RSS feed
  maxTotalItems: 100,         // Max total items displayed
  refreshInterval: 60000,     // Refresh every 60 seconds
  cacheTime: 60,              // Cache for 60 seconds
};
```

## Troubleshooting

### No News Appearing

1. Check that your topic is spelled correctly
2. Verify RSS feeds are accessible
3. Check browser console for errors
4. Ensure environment variable is set correctly

### Slow Performance

1. Reduce `maxItemsPerFeed` and `maxTotalItems`
2. Increase `refreshInterval`
3. Increase `cacheTime`

### RSS Feed Errors

1. Check if RSS URLs are still valid
2. Some feeds may require authentication
3. Consider replacing problematic feeds with alternatives

### Topic Filtering Issues

1. Make sure your RSS feeds actually contain content related to your topic
2. The system filters by checking if the topic appears in the title or content
3. If you're getting too few results, consider using more general RSS feeds
4. If you're getting too many irrelevant results, use more specific RSS feeds
