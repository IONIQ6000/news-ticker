"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "../lib/utils";
import { NEWS_CONFIG } from "../lib/config";
import { useSettings } from "@/components/SettingsProvider";

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
};

type NewsResponse = {
  topic: string;
  items: NewsItem[];
  totalFeeds: number;
  lastUpdated: string;
  feedDiscoveryMethod?: string;
};

// News Mood Visualizer component - completely independent
const NewsMoodVisualizer = React.memo(({ items }: { items: NewsItem[] }) => {
  // Memoize the mood data calculation to prevent unnecessary recalculations
  const moodData = React.useMemo(() => {
    if (items.length === 0) {
      return { positive: 0, negative: 0, neutral: 0, total: 0 };
    }

    // Memoize the sentiment analysis function
    const analyzeSentiment = (text: string) => {
      const lowerText = text.toLowerCase();
      
      // Positive keywords
      const positiveWords = ['breakthrough', 'success', 'win', 'victory', 'achievement', 'innovation', 'growth', 'positive', 'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'brilliant', 'outstanding', 'remarkable', 'inspiring', 'hopeful', 'optimistic'];
      
      // Negative keywords
      const negativeWords = ['crisis', 'disaster', 'failure', 'loss', 'death', 'attack', 'crash', 'scandal', 'corruption', 'violence', 'war', 'conflict', 'tragedy', 'devastating', 'terrible', 'horrible', 'awful', 'worst', 'dangerous', 'threatening'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveCount++;
      });
      
      negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeCount++;
      });
      
      if (positiveCount > negativeCount) return 'positive';
      if (negativeCount > positiveCount) return 'negative';
      return 'neutral';
    };

    let positive = 0, negative = 0, neutral = 0;
    
    items.forEach(item => {
      const sentiment = analyzeSentiment(item.title);
      if (sentiment === 'positive') positive++;
      else if (sentiment === 'negative') negative++;
      else neutral++;
    });

    return { positive, negative, neutral, total: items.length };
  }, [items]);

  if (moodData.total === 0) return null;

  const positivePercent = (moodData.positive / moodData.total) * 100;
  const negativePercent = (moodData.negative / moodData.total) * 100;
  const neutralPercent = (moodData.neutral / moodData.total) * 100;

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">
          News Mood Analysis
        </h3>
        <div className="text-white/40 text-xs">
          {moodData.total} stories analyzed • Real-time sentiment tracking
        </div>
      </div>
      
      {/* Mood Flow Visualization */}
      <div className="relative w-full h-32 mb-6">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-lg" />
        </div>
        
        {/* Reference lines for mood spectrum */}
        <div className="absolute inset-0">
          {/* Center line (neutral baseline) */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10 transform -translate-y-1/2" />
          
          {/* Positive zone indicator */}
          <div className="absolute left-0 right-0 top-1/4 h-px bg-white/5 transform -translate-y-1/2" />
          <div className="absolute left-2 top-1/4 transform -translate-y-1/2 text-white/30 text-[10px] font-medium">
            Positive
          </div>
          
          {/* Negative zone indicator */}
          <div className="absolute left-0 right-0 top-3/4 h-px bg-white/5 transform -translate-y-1/2" />
          <div className="absolute left-2 top-3/4 transform -translate-y-1/2 text-white/30 text-[10px] font-medium">
            Negative
          </div>
          
          {/* Neutral zone indicator */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/30 text-[10px] font-medium">
            Neutral
          </div>
        </div>
        
        {/* Mood particles */}
        {React.useMemo(() => {
          return Array.from({ length: Math.min(moodData.total, 30) }).map((_, i) => {
            const sentiment = i < moodData.positive ? 'positive' : 
                             i < moodData.positive + moodData.negative ? 'negative' : 'neutral';
            const size = Math.random() * 4 + 2;
            const x = Math.random() * 100;
            
            // Position particles based on sentiment zones
            let y;
            if (sentiment === 'positive') {
              y = Math.random() * 25; // Top quarter (positive zone)
            } else if (sentiment === 'negative') {
              y = 75 + Math.random() * 25; // Bottom quarter (negative zone)
            } else {
              y = 37.5 + Math.random() * 25; // Middle half (neutral zone)
            }
            
            return {
              id: i,
              sentiment,
              size,
              x,
              y,
              delay: i * 50 // Stagger delay in milliseconds
            };
          });
        }, [moodData.total, moodData.positive, moodData.negative]).map((particle) => (
          <div
            key={particle.id}
            className={cn(
              "absolute rounded-full animate-pulse transition-all duration-1000 ease-out",
              particle.sentiment === 'positive' ? 'bg-white/70' : 
              particle.sentiment === 'negative' ? 'bg-white/40' : 'bg-white/55'
            )}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}ms`,
              animationDuration: `${6 + Math.random() * 4}s` // Slower: 6-10 seconds instead of 2-4
            }}
          />
        ))}
        
        {/* Sentiment flow lines - Single lines for each section, no animation */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="moodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </linearGradient>
          </defs>
          
          {/* Positive sentiment flow - straight line in positive zone */}
          <line
            x1="5"
            y1="20"
            x2="95"
            y2="20"
            stroke="url(#moodGradient)"
            strokeWidth="1"
            opacity="0.8"
          />
          
          {/* Negative sentiment flow - straight line in negative zone */}
          <line
            x1="5"
            y1="80"
            x2="95"
            y2="80"
            stroke="url(#moodGradient)"
            strokeWidth="1"
            opacity="0.6"
          />
          
          {/* Neutral sentiment flow - straight line through center */}
          <line
            x1="5"
            y1="50"
            x2="95"
            y2="50"
            stroke="url(#moodGradient)"
            strokeWidth="0.8"
            opacity="0.5"
          />
        </svg>
      </div>
      
      {/* Sentiment breakdown */}
      <div className="flex justify-center items-center gap-12 text-sm">
        <div className="text-center">
          <div className="text-white/90 font-semibold text-lg">{moodData.positive}</div>
          <div className="text-white/50 text-xs uppercase tracking-wider">Positive</div>
          <div className="text-white/30 text-xs">{positivePercent.toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-white/90 font-semibold text-lg">{moodData.neutral}</div>
          <div className="text-white/50 text-xs uppercase tracking-wider">Neutral</div>
          <div className="text-white/30 text-xs">{neutralPercent.toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-white/90 font-semibold text-lg">{moodData.negative}</div>
          <div className="text-white/50 text-xs uppercase tracking-wider">Negative</div>
          <div className="text-white/30 text-xs">{negativePercent.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
});

// Breaking News Alerts removed as requested

export function NewsTicker({ className, visibleRows = 6 }: { className?: string; visibleRows?: number }) {
  const { tickerSpeed } = useSettings();
  const [items, setItems] = React.useState<NewsItem[]>([]);
  const [topic, setTopic] = React.useState<string>("");
  const [totalFeeds, setTotalFeeds] = React.useState<number>(0);
  const [lastUpdated, setLastUpdated] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");
  const initialRows = Math.max(1, Math.min(visibleRows ?? 6, 15));
  const [userVisibleRows, setUserVisibleRows] = React.useState<number>(initialRows);
  const rowCount = Math.max(1, Math.min(userVisibleRows, 15));
  const [tickerStates, setTickerStates] = React.useState<boolean[]>(Array(rowCount).fill(false));
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [refreshProgress, setRefreshProgress] = React.useState<number>(0);
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const staggerTimeoutsRef = React.useRef<number[]>([]);

  // Track latest refreshing state inside interval callbacks
  const isRefreshingRef = React.useRef(false);
  React.useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  // Function to trigger staggered animations
  const triggerStaggeredAnimations = () => {
    // Clear any in-flight stagger timers
    if (staggerTimeoutsRef.current.length) {
      staggerTimeoutsRef.current.forEach((t) => clearTimeout(t));
      staggerTimeoutsRef.current = [];
    }

    // Reset all rows hidden
    setTickerStates(Array(rowCount).fill(false));

    const baseDelay = 60; // first row fades shortly after paint

    // Stagger rows from top to bottom (row 1 included)
    for (let i = 0; i < rowCount; i++) {
      const t = window.setTimeout(() => {
        setTickerStates(prev => {
          const next = [...prev];
          if (i < next.length) next[i] = true;
          return next;
        });
      }, baseDelay + i * 200);
      staggerTimeoutsRef.current.push(t as unknown as number);
    }
  };

  React.useEffect(() => {
    // Reset and re-trigger animations when row count changes
    setTickerStates(Array(rowCount).fill(false));
    triggerStaggeredAnimations();
  }, [rowCount]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (staggerTimeoutsRef.current.length) {
        staggerTimeoutsRef.current.forEach((t) => clearTimeout(t));
        staggerTimeoutsRef.current = [];
      }
    };
  }, []);

  // Manual refresh function
  const manualRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/news", { next: { revalidate: 30 } });
      
      if (res.ok) {
        const data: NewsResponse = await res.json();
        setItems(data.items);
        setTopic(data.topic);
        setTotalFeeds(data.totalFeeds);
        setLastUpdated(data.lastUpdated);
        setIsRefreshing(false);
        setRefreshProgress(0);
        triggerStaggeredAnimations();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch news");
      setIsRefreshing(false);
    }
  };

  // Progress bar component
  const RefreshProgressBar = () => {
    const totalDots = 30; // 30 dots for 60 seconds = 2 seconds per dot
    const activeDots = Math.floor((refreshProgress / 100) * totalDots);
    
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: totalDots }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-500",
              i < activeDots 
                ? "bg-white/70" // Active dots (brighter)
                : "bg-white/15" // Inactive dots (dimmer)
            )}
          />
        ))}
      </div>
    );
  };

  // Play/Pause button component
  const PlayPauseButton = () => (
    <button
      onClick={() => {
        if (isPaused) {
          // Resume: just unpause, don't refresh immediately
          setIsPaused(false);
        } else {
          // Pause: stop auto-refresh
          setIsPaused(true);
        }
      }}
      className={cn(
        "w-6 h-6 rounded-full border border-white/30 flex items-center justify-center transition-all duration-200 hover:border-white/50 hover:bg-white/10",
        isPaused ? "bg-white/20" : "bg-white/5"
      )}
      title={isPaused ? "Resume auto-refresh" : "Pause auto-refresh"}
    >
      {isPaused ? (
        // Play icon (triangle)
        <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
      ) : (
        // Pause icon (two bars)
        <div className="flex items-center gap-0.5">
          <div className="w-1 h-3 bg-white rounded-sm" />
          <div className="w-1 h-3 bg-white rounded-sm" />
        </div>
      )}
    </button>
  );

  React.useEffect(() => {
    let cancelled = false;
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch("/api/news", { next: { revalidate: 30 } });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: NewsResponse = await res.json();
        if (!cancelled) {
          setItems(data.items);
          setTopic(data.topic);
          setTotalFeeds(data.totalFeeds);
          setLastUpdated(data.lastUpdated);
          setIsLoading(false);
          setRefreshProgress(0);
          // Initial load animations
          triggerStaggeredAnimations();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch news");
          setIsLoading(false);
        }
      }
    };

    // Only fetch initial data
    fetchNews();

    return () => {
      cancelled = true;
    };
  }, []); // Only run once on mount

  // Separate effect for auto-refresh (only when not paused)
  React.useEffect(() => {
    if (isPaused || isLoading) return;

    const autoRefresh = async () => {
      // Skip if a manual or previous auto refresh is already in progress
      if (isRefreshingRef.current) return;
      try {
        setIsRefreshing(true);
        const res = await fetch("/api/news", { next: { revalidate: 30 } });
        
        if (res.ok) {
          const data: NewsResponse = await res.json();
          
          // Only update items if they actually changed
          const currentItemsHash = items.map(item => `${item.title}:${item.source}`).join('|');
          const newItemsHash = data.items.map(item => `${item.title}:${item.source}`).join('|');
          
          if (currentItemsHash !== newItemsHash) {
            setItems(data.items);
            setTopic(data.topic);
            setTotalFeeds(data.totalFeeds);
            setLastUpdated(data.lastUpdated);
            triggerStaggeredAnimations();
          } else {
            // Items haven't changed, just update the timestamp
            setLastUpdated(data.lastUpdated);
          }
          
          setIsRefreshing(false);
          setRefreshProgress(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch news");
        setIsRefreshing(false);
      }
    };

    // Set up auto-refresh interval
    const intervalId = setInterval(autoRefresh, NEWS_CONFIG.refreshInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isPaused, isLoading, lastUpdated]);

  // Progress bar countdown effect
  React.useEffect(() => {
    if (isLoading || isRefreshing || isPaused) return;
    
    // Calculate time since last refresh
    const lastRefreshTime = lastUpdated ? new Date(lastUpdated).getTime() : Date.now();
    const now = Date.now();
    const timeSinceRefresh = now - lastRefreshTime;
    const timeUntilNextRefresh = NEWS_CONFIG.refreshInterval - timeSinceRefresh;
    
    // Set initial progress based on elapsed time
    if (timeSinceRefresh < NEWS_CONFIG.refreshInterval) {
      const initialProgress = (timeSinceRefresh / NEWS_CONFIG.refreshInterval) * 100;
      setRefreshProgress(Math.min(initialProgress, 100));
    }
    
    const interval = setInterval(() => {
      setRefreshProgress(prev => {
        const currentTime = Date.now();
        const elapsed = currentTime - lastRefreshTime;
        const progress = (elapsed / NEWS_CONFIG.refreshInterval) * 100;
        
        if (progress >= 100) return 100;
        return progress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, isRefreshing, lastUpdated, isPaused]);

  // Loading skeleton component
  const LoadingSkeleton = ({ className = "" }: { className?: string }) => (
    <div className={cn("flex items-center gap-4 px-6 py-3", className)}>
      <div className="w-20 h-5 bg-white/10 rounded-full animate-pulse"></div>
      <div className="flex-1 h-5 bg-white/10 rounded animate-pulse"></div>
      <div className="w-4 h-5 bg-white/10 rounded animate-pulse"></div>
    </div>
  );

  // Loading row component
  const LoadingRow = ({ count = 8 }: { count?: number }) => (
    <div className="border-b border-white/10">
      <div className="flex whitespace-nowrap">
        {Array.from({ length: count }).map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  // Create ticker rows with extensive duplication for seamless looping
  const createTickerRow = (items: NewsItem[], offset: number = 0) => {
    const source = (items || []).slice(offset);
    if (source.length === 0) {
      const placeholders = Array.from({ length: 25 }).map((_, i) => ({
    id: `placeholder-${i}`,
        title: `Sample news headline ${i + 1} - This is a placeholder to ensure the ticker has enough content to move smoothly without jumps`,
    url: "#",
        source: `Source ${i + 1}`,
      }));

      const copies = 2;
      const duplicated: typeof placeholders = [];
      for (let c = 0; c < copies; c++) {
        duplicated.push(...placeholders);
      }
      return duplicated;
    }

    // Take only the top 20 most relevant articles to ensure consistent speed
    const topArticles = source.slice(0, 20);

    // Normalize all items to have consistent widths
    const normalizedItems = topArticles.map(item => {
      let normalizedTitle = item.title;

      // Ensure title is at least 80 characters but don't truncate
      if (normalizedTitle.length < 80) {
        normalizedTitle = normalizedTitle.padEnd(80, " ");
      }

      // Ensure source is always present and consistent length
      const normalizedSource = (item.source || "News").padEnd(15, " ");

      return {
        ...item,
        title: normalizedTitle,
        source: normalizedSource,
      };
    });

    const copies = 2;
    const duplicated: typeof normalizedItems = [];
    for (let c = 0; c < copies; c++) {
      duplicated.push(...normalizedItems);
    }
    return duplicated;
  };

  const rowsData: NewsItem[][] = React.useMemo(() => {
    return Array.from({ length: rowCount }, (_, i) => createTickerRow(items, i));
  }, [items, rowCount]);

  const getRowStyle = (i: number): React.CSSProperties => {
    const isLeft = i % 2 === 0;
    const base = 420; // seconds
    const increment = 30; // seconds per row
    const speed = Math.max(0.5, Math.min(3, tickerSpeed));
    const duration = (base + i * increment) / speed;
    return {
      animation: `${isLeft ? 'ticker-left' : 'ticker-right'} ${duration}s linear infinite`,
      transform: isLeft ? 'translateX(0)' : 'translateX(-50%)',
      minWidth: 'max-content',
      willChange: 'transform',
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d',
      perspective: '1000px',
      animationDelay: `-${i * 15}s`,
      contain: 'layout style paint',
      isolation: 'isolate'
    } as React.CSSProperties;
  };

  // Ultra-slow animation styles for comfortable reading
  const tickerLeftStyle = {
    animation: 'ticker-left 420s linear infinite',
    transform: 'translateX(0)',
    minWidth: 'max-content',
    willChange: 'transform' as const,
    backfaceVisibility: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px',
  };

  const tickerRightStyle = {
    animation: 'ticker-right 480s linear infinite',
    transform: 'translateX(-50%)',
    minWidth: 'max-content',
    willChange: 'transform' as const,
    backfaceVisibility: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px',
  };

  const tickerLeftStyleSlow = {
    animation: 'ticker-left 540s linear infinite',
    transform: 'translateX(0)',
    minWidth: 'max-content',
    willChange: 'transform' as const,
    backfaceVisibility: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px',
  };

  const tickerRightStyleSlow = {
    animation: 'ticker-right 600s linear infinite',
    transform: 'translateX(-50%)',
    minWidth: 'max-content',
    willChange: 'transform' as const,
    backfaceVisibility: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px',
  };

  const tickerLeftStyleUltraSlow = {
    animation: 'ticker-left 660s linear infinite',
    transform: 'translateX(0)',
    minWidth: 'max-content',
    willChange: 'transform' as const,
    backfaceVisibility: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px',
  };

  const tickerRightStyleUltraSlow = {
    animation: 'ticker-right 720s linear infinite',
    transform: 'translateX(-50%)',
    minWidth: 'max-content',
    willChange: 'transform' as const,
    backfaceVisibility: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px',
  };

  return (
    <div className={cn("w-full overflow-hidden bg-black text-white", className)}>
      {/* Loading Screen */}
      {isLoading && (
        <div className="space-y-0">
          {/* Topic and Status Bar Skeleton */}
          <div className="border-y border-white/10 pt-8 pb-4">
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="w-16 h-6 bg-white/10 rounded animate-pulse"></div>
                <div className="w-20 h-6 bg-white/10 rounded animate-pulse"></div>
                <div className="w-24 h-6 bg-white/10 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/10 rounded-full"></div>
                <div className="w-5 h-5 bg-white/10 rounded"></div>
                <div className="w-20 h-6 bg-white/10 rounded animate-pulse"></div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-white/10 rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading Ticker Rows */}
          <LoadingRow count={10} />
          <LoadingRow count={8} />
          <LoadingRow count={12} />
          <LoadingRow count={9} />
          <LoadingRow count={11} />
          <LoadingRow count={10} />
          <LoadingRow count={8} />
        </div>
      )}

      {/* News Tickers with Fade-in Animation */}
      {!isLoading && (
        <>
          {/* Breaking News Alerts removed */}
          {/* Topic and Status Bar */}
          <div className="border-y border-white/10 pt-8 pb-4">
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="text-white/60 text-sm">Topic:</div>
                <div className="text-white font-medium">{topic || "Loading..."}</div>
                <div className="text-white/40 text-sm">•</div>
                <div className="text-white/60 text-sm">{totalFeeds} feeds</div>
              </div>
              <div className="flex items-center gap-2">
                {/* Visible rows control - modern segmented slider */}
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-xs text-white/60">Rows</span>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={rowCount}
                    onChange={(e) => setUserVisibleRows(Number(e.target.value))}
                    className="w-36 h-2 appearance-none bg-white/10 rounded-full outline-none cursor-pointer [accent-color:white]"
                  />
                  <span className="text-xs text-white/60 w-6 text-right tabular-nums">{rowCount}</span>
                </div>
                {/* Mobile fallback */}
                <div className="md:hidden">
                  <select
                    value={rowCount}
                    onChange={(e) => setUserVisibleRows(Number(e.target.value))}
                    className="bg-black/40 border border-white/15 rounded px-2 py-1 text-white/80 focus:outline-none focus:ring-1 focus:ring-white/30 text-xs"
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <PlayPauseButton />
                <RefreshProgressBar />
                <button
                  onClick={manualRefresh}
                  disabled={isRefreshing}
                  className={cn(
                    "w-5 h-5 rounded transition-all duration-200 hover:bg-white/10",
                    isRefreshing ? "animate-spin" : "hover:scale-110"
                  )}
                  title="Manual refresh"
                >
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Ticker Rows */}
          {rowsData.map((rowItems, i) => (
            <div
              key={`ticker-row-${i}`}
              className={cn(
                i === 0 ? "border-y border-white/10" : "border-b border-white/10",
                "transition-all duration-1200 ease-in-out",
                tickerStates[i] ? "opacity-100 translate-y-0 blur-0 scale-100" : "opacity-0 translate-y-4 blur-[2px] scale-[0.99]",
                isRefreshing && tickerStates[i] ? "opacity-50 blur-sm" : ""
              )}
            >
              <div className="relative">
                <div className="flex whitespace-nowrap will-change-transform" style={getRowStyle(i)}>
                  {rowItems.map((item, idx) => (
                    <span
                      key={`row${i}-${item.id}-${idx}`}
                      className="flex items-center gap-4 px-6 py-3 text-sm md:text-base flex-shrink-0"
                    >
                      {item.source && (
                        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide flex-shrink-0">
                          {item.source}
                        </span>
                      )}
                      <Link
                        href={item.url}
                        target="_blank"
                        className={cn(
                          "hover:underline transition-colors flex-1",
                          item.url === "#" ? "text-white/50 cursor-default" : "text-white hover:text-white/80"
                        )}
                        onClick={(e) => {
                          if (item.url === "#") {
                            e.preventDefault();
                          }
                        }}
                      >
                        {item.title}
                      </Link>
                      <span className="mx-2 text-white/30 flex-shrink-0">•</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* News Mood Visualizer Section */}
          <div className={cn(
            "border-t border-white/10 bg-white/5 transition-all duration-1000 ease-out",
            tickerStates[rowCount - 1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            isRefreshing ? "opacity-50 blur-sm" : ""
          )}>
            <div className="mx-auto max-w-6xl px-6 py-6">
              <NewsMoodVisualizer items={items} />
            </div>
          </div>

          
        </>
      )}
    </div>
  );
}
