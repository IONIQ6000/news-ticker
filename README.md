# News Ticker

A modern, **single-topic** news ticker built with Next.js, Tailwind CSS, and RSS feeds. The system automatically filters news from multiple sources based on **one configurable topic**.

## Features

- **Single topic focus**: Automatically filters news by **one topic only** (technology, business, sports, politics, science, health)
- **Real-time updates**: Refreshes news every minute with smooth ticker animation
- **Curated RSS sources**: Hand-picked RSS feeds for your chosen topic
- **Responsive design**: Works on desktop and mobile devices
- **Simple configuration**: Set one topic and the system handles the rest

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure your single topic**:
   ```bash
   # Set environment variable
   export NEWS_TOPIC=technology
   
   # Or edit src/lib/config.ts directly
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Configuration

### Setting Your Topic

The ticker is designed to show **one topic only**. Choose from:

- **technology** - Tech industry news
- **business** - Business and finance news  
- **sports** - Sports news
- **politics** - Political news
- **science** - Scientific discoveries
- **health** - Health and medical news

### Customizing Your Topic

#### Option 1: Environment Variable (Recommended)
```bash
export NEWS_TOPIC=business
npm run dev
```

#### Option 2: Edit Configuration File
Modify `src/lib/config.ts`:
```typescript
export const NEWS_CONFIG = {
  topic: "business", // Change this line to your preferred topic
  // ... rest of config
};
```

#### Option 3: Command Line
```bash
# For business news
export NEWS_TOPIC=business && npm run dev

# For sports news
export NEWS_TOPIC=sports && npm run dev
```

### Customizing RSS Feeds

You can customize the RSS feeds in `src/lib/config.ts` to match your topic:

```typescript
feeds: [
  { url: "https://your-favorite-news-site.com/rss", source: "Your Source" },
  { url: "https://another-news-site.com/feed", source: "Another Source" },
  // Add more RSS feeds for your topic
],
```

## How It Works

1. **Single Topic Focus**: The system is configured for **one topic only**
2. **RSS Aggregation**: Fetches news from multiple RSS feeds
3. **Topic Filtering**: Automatically filters news to match your chosen topic
4. **Smart Sorting**: News is sorted by publication date (newest first)
5. **Real-time Updates**: The ticker refreshes automatically every minute

## RSS Feed Sources

The system includes carefully curated RSS feeds. You can customize these by editing the `feeds` array in `src/lib/config.ts` to match your topic.

## Performance

- **Caching**: News is cached for 1 minute to reduce API calls
- **Lazy Loading**: Only loads necessary data
- **Optimized Animation**: Smooth ticker animation with CSS transforms
- **Error Handling**: Graceful fallbacks when RSS feeds are unavailable

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Technologies Used

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **RSS Parser** - RSS feed parsing
- **TypeScript** - Type safety

## License

This project is open source and available under the [MIT License](LICENSE).
