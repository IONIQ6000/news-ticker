"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "../lib/utils";
import { NEWS_CONFIG, VALID_TOPICS } from "../lib/config";
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

const NewsMoodVisualizer = React.memo(({ items }: { items: NewsItem[] }) => {
  const { theme } = useSettings();
  const [view, setView] = React.useState<"mood" | "sources">("mood");
  const switchTimeoutRef = React.useRef<number | null>(null);

  const changeView = React.useCallback((next: "mood" | "sources") => {
    if (next === view) return;
    if (switchTimeoutRef.current) {
      window.clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }
    switchTimeoutRef.current = window.setTimeout(() => {}, 300) as unknown as number;
    setView(next);
  }, [view]);

  React.useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) window.clearTimeout(switchTimeoutRef.current);
    };
  }, []);

  const moodData = React.useMemo(() => {
    if (items.length === 0) return { positive: 0, negative: 0, neutral: 0, total: 0 };
    const analyze = (t: string) => {
      const s = t.toLowerCase();
      const pos = ["breakthrough","success","win","victory","achievement","innovation","growth","positive","good","great","excellent","amazing","wonderful","fantastic","brilliant","outstanding","remarkable","inspiring","hopeful","optimistic"]; 
      const neg = ["crisis","disaster","failure","loss","death","attack","crash","scandal","corruption","violence","war","conflict","tragedy","devastating","terrible","horrible","awful","worst","dangerous","threatening"]; 
      let a = 0, b = 0; pos.forEach(w=>{ if (s.includes(w)) a++; }); neg.forEach(w=>{ if (s.includes(w)) b++; });
      return a>b?"positive":b>a?"negative":"neutral";
    };
    let p=0,n=0,u=0; for (const it of items){ const m=analyze(it.title); if(m==="positive")p++; else if(m==="negative")n++; else u++; }
    return { positive: p, negative: n, neutral: u, total: items.length };
  }, [items]);

  const hasData = moodData.total > 0;
  const positivePercent = (moodData.positive / (moodData.total || 1)) * 100;
  const negativePercent = (moodData.negative / (moodData.total || 1)) * 100;
  const neutralPercent = (moodData.neutral / (moodData.total || 1)) * 100;

  const colorStrong = theme === 'light' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.90)';
  const colorMid = theme === 'light' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)';
  const colorSoft = theme === 'light' ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.30)';
  const colorTrack = theme === 'light' ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';

  return (
    <div className="w-full">
      <div className="flex justify-center mb-3">
        <div className={cn("relative inline-flex items-center w-56 h-9 rounded-full border text-xs font-medium overflow-hidden", theme === 'light' ? "border-black/20 bg-black/5" : "border-white/15 bg-white/5 supports-[backdrop-filter]:bg-white/10")}> 
          <div
            className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out"
            style={{
              width: 'calc(50% - 8px)',
              left: view === 'mood' ? 4 : 'calc(50% + 4px)',
              backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.18)',
              boxShadow: theme === 'light' ? 'inset 0 0 0 1px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.10)' : 'inset 0 0 0 1px rgba(255,255,255,0.20), 0 1px 2px rgba(0,0,0,0.35)'
            }}
            aria-hidden="true"
          />
          <button type="button" className={cn("relative z-10 flex-1 h-full rounded-full transition-colors", view === 'mood' ? (theme === 'light' ? "text-black" : "text-white") : (theme === 'light' ? "text-black/50" : "text-white/60"))} onClick={()=>changeView('mood')}>Mood</button>
          <button type="button" className={cn("relative z-10 flex-1 h-full rounded-full transition-colors", view === 'sources' ? (theme === 'light' ? "text-black" : "text-white") : (theme === 'light' ? "text-black/50" : "text-white/60"))} onClick={()=>changeView('sources')}>Sources</button>
        </div>
      </div>

      <div className="text-center mb-4">
        {view === 'mood' ? (
          <>
            <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">News Mood Analysis</h3>
            <div className="text-white/40 text-xs">{moodData.total} stories analyzed • Real-time sentiment tracking</div>
          </>
        ) : (
          <>
            <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">Source Breakdown</h3>
            <div className="text-white/40 text-xs">{moodData.total} stories • {
              Array.from(new Set(items.map(i => i.source || 'Unknown'))).length
            } sources</div>
          </>
        )}
      </div>

      {view === 'mood' && (
        <div className="mx-auto w-full max-w-xl mb-6">
          <div className="relative h-4 rounded-full overflow-hidden" style={{ backgroundColor: colorTrack }}>
            {hasData ? (
              <>
                <div className="absolute left-0 top-0 h-full" style={{ width: `${positivePercent}%`, backgroundColor: colorStrong }} />
                <div className="absolute top-0 h-full" style={{ left: `${positivePercent}%`, width: `${neutralPercent}%`, backgroundColor: colorMid }} />
                <div className="absolute right-0 top-0 h-full" style={{ width: `${negativePercent}%`, backgroundColor: colorSoft }} />
              </>
            ) : null}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-white/60">
            <span>Positive {hasData ? positivePercent.toFixed(0) : '0'}%</span>
            <span>Neutral {hasData ? neutralPercent.toFixed(0) : '0'}%</span>
            <span>Negative {hasData ? negativePercent.toFixed(0) : '0'}%</span>
          </div>
        </div>
      )}

      {view === 'sources' && (
        <div className="mx-auto w-full max-w-xl space-y-3">
          {Array.from(Object.entries(items.reduce<Record<string, number>>((acc, it) => { const k=(it.source||'Unknown').trim()||'Unknown'; acc[k]=(acc[k]||0)+1; return acc; }, {})).sort((a,b)=>b[1]-a[1]))
            .slice(0,6)
            .map(([name, count]) => {
              const pct = (count / (items.length || 1)) * 100;
              return (
                <div key={name}>
                  <div className="flex items-end justify-between mb-1">
                    <div className="text-[12px] text-white/80 truncate pr-2">{name}</div>
                    <div className="text-[11px] text-white/50 tabular-nums">{pct.toFixed(0)}%</div>
                  </div>
                  <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: colorTrack }}>
                    <div className="absolute left-0 top-0 h-full" style={{ width: `${pct}%`, backgroundColor: colorStrong }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
});

NewsMoodVisualizer.displayName = "NewsMoodVisualizer";

export function NewsTicker({ className, visibleRows = 6 }: { className?: string; visibleRows?: number }) {
  const { tickerSpeed, theme } = useSettings();
  const [items, setItems] = React.useState<NewsItem[]>([]);
  const [topic, setTopic] = React.useState<string>("");
  const [totalFeeds, setTotalFeeds] = React.useState<number>(0);
  const [lastUpdated, setLastUpdated] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");
  const [selectedTopic, setSelectedTopic] = React.useState<string>(NEWS_CONFIG.topic);
  const [topicInput, setTopicInput] = React.useState<string>(NEWS_CONFIG.topic);
  const initialRows = Math.max(1, Math.min(visibleRows ?? 6, 15));
  const [userVisibleRows, setUserVisibleRows] = React.useState<number>(initialRows);
  const rowCount = Math.max(1, Math.min(userVisibleRows, 15));
  const [tickerStates, setTickerStates] = React.useState<boolean[]>(Array(rowCount).fill(false));
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [refreshProgress, setRefreshProgress] = React.useState<number>(0);
  const [refreshEpochMs, setRefreshEpochMs] = React.useState<number>(Date.now());
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const [layoutSeed, setLayoutSeed] = React.useState<number>(Date.now());
  const staggerTimeoutsRef = React.useRef<number[]>([]);
  const [isTopicOpen, setIsTopicOpen] = React.useState<boolean>(false);
  const ignoreBlurRef = React.useRef<boolean>(false);
  const TOPIC_FADE_MS = 600;
  const fadeTimeoutRef = React.useRef<number | null>(null);
  const DROPDOWN_FADE_IN_MS = 275;
  const DROPDOWN_FADE_OUT_MS = 600;
  // Topic-like refresh animation support
  const refreshSwapTimeoutRef = React.useRef<number | null>(null);
  const [topicRender, setTopicRender] = React.useState<boolean>(false);
  const [topicVisible, setTopicVisible] = React.useState<boolean>(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Transition policy: Keep refresh identical to topic-change
  // Fade rows out (set all tickerStates=false), wait TOPIC_FADE_MS, swap data, then triggerStaggeredAnimations.
  // Do not use overlay or global black fade. This avoids duplicate content and flicker.

  // Dev-only guard: prevent reintroduction of overlay crossfades
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV === 'production') return;
    const overlays = document.querySelectorAll('[data-news-rows="overlay"]');
    if (overlays.length > 0) {
      // Surface loudly in dev to deter regressions
      // eslint-disable-next-line no-console
      console.error('[UI Transition Policy] Overlay crossfade detected (data-news-rows="overlay"). Use topic-style fade (set rows hidden, swap after TOPIC_FADE_MS, then stagger in).');
    }
  }, []);

  React.useEffect(() => {
    try {
      const mq = window.matchMedia("(max-width: 640px), (orientation: portrait) and (max-width: 900px)");
      if (mq.matches) setUserVisibleRows((prev) => Math.min(prev, 3));
    } catch {}
  }, []);

  React.useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) { clearTimeout(fadeTimeoutRef.current); fadeTimeoutRef.current = null; }
      if (staggerTimeoutsRef.current.length) {
        staggerTimeoutsRef.current.forEach((t) => clearTimeout(t));
        staggerTimeoutsRef.current = [];
      }
      if (refreshSwapTimeoutRef.current) { clearTimeout(refreshSwapTimeoutRef.current); refreshSwapTimeoutRef.current = null; }
    };
  }, []);

  React.useLayoutEffect(() => {
    if (isTopicOpen) {
      setTopicRender(true);
      setTopicVisible(false);
      let r1 = 0, r2 = 0;
      r1 = requestAnimationFrame(() => {
        void dropdownRef.current?.getBoundingClientRect();
        r2 = requestAnimationFrame(() => setTopicVisible(true));
      });
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    } else {
      setTopicVisible(false);
      const t = setTimeout(() => setTopicRender(false), DROPDOWN_FADE_OUT_MS);
      return () => clearTimeout(t);
    }
  }, [isTopicOpen, DROPDOWN_FADE_OUT_MS]);

  const isRefreshingRef = React.useRef(false);
  React.useEffect(() => { isRefreshingRef.current = isRefreshing; }, [isRefreshing]);

  const triggerStaggeredAnimations = () => {
    if (staggerTimeoutsRef.current.length) { staggerTimeoutsRef.current.forEach((t) => clearTimeout(t)); staggerTimeoutsRef.current = []; }
    setTickerStates(Array(rowCount).fill(false));
    const baseDelay = 60;
    for (let i = 0; i < rowCount; i++) {
      const t = window.setTimeout(() => {
        setTickerStates(prev => { const next = [...prev]; if (i < next.length) next[i] = true; return next; });
      }, baseDelay + i * 200);
      staggerTimeoutsRef.current.push(t as unknown as number);
    }
  };

  React.useEffect(() => { setTickerStates(Array(rowCount).fill(false)); triggerStaggeredAnimations(); }, [rowCount]);

  const manualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams({ topic: selectedTopic });
      const res = await fetch(`/api/news?${params.toString()}`, { next: { revalidate: 30 } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsResponse = await res.json();

      // Topic-style: fade rows out, then swap and stagger in
      setTickerStates((prev) => prev.map(() => false));
      if (refreshSwapTimeoutRef.current) clearTimeout(refreshSwapTimeoutRef.current);
      refreshSwapTimeoutRef.current = window.setTimeout(() => {
        setItems(data.items);
        setTopic(data.topic);
        setTotalFeeds(data.totalFeeds);
        setLastUpdated(data.lastUpdated);
        setRefreshProgress(0);
        triggerStaggeredAnimations();
        setRefreshEpochMs(Date.now());
        setIsRefreshing(false);
      }, TOPIC_FADE_MS) as unknown as number;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch news");
      setIsRefreshing(false);
    }
  };

  const applyTopicInput = React.useCallback(() => {
    const normalized = topicInput.trim();
    if (normalized.length === 0) { setTopicInput(selectedTopic); return; }
    if (normalized !== selectedTopic) {
      setTickerStates((prev) => prev.map(() => false));
      if (fadeTimeoutRef.current) { clearTimeout(fadeTimeoutRef.current); }
      fadeTimeoutRef.current = window.setTimeout(() => {
        setSelectedTopic(normalized);
        setLastUpdated(new Date().toISOString());
      }, TOPIC_FADE_MS) as unknown as number;
    }
  }, [topicInput, selectedTopic]);

  const RefreshProgressBar = () => {
    const totalDots = 30; const activeDots = Math.floor((refreshProgress / 100) * totalDots);
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: totalDots }).map((_, i) => (
          <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-500", i < activeDots ? (theme === 'light' ? "bg-black/80" : "bg-white/70") : (theme === 'light' ? "bg-black/15" : "bg-white/15"))} />
        ))}
      </div>
    );
  };

  const PlayPauseButton = () => (
    <button
      onClick={() => setIsPaused((p)=>!p)}
      className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200", theme === 'light' ? "border border-black/30 hover:border-black/50 hover:bg-black/10" : "border border-white/30 hover:border-white/50 hover:bg-white/10", isPaused ? (theme === 'light' ? "bg-black/20" : "bg-white/20") : (theme === 'light' ? "bg-black/5" : "bg-white/5"))}
      title={isPaused ? "Resume auto-refresh" : "Pause auto-refresh"}
    >
      {isPaused ? (
        <div className={cn("w-0 h-0 border-l-[6px] border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5")} style={{ borderLeftColor: theme === 'light' ? '#101114' : '#ffffff' }} />
      ) : (
        <div className="flex items-center gap-0.5"><div className="w-1 h-3 rounded-sm" style={{ backgroundColor: theme === 'light' ? 'rgba(16,17,20,1)' : 'rgba(255,255,255,1)' }} /><div className="w-1 h-3 rounded-sm" style={{ backgroundColor: theme === 'light' ? 'rgba(16,17,20,1)' : 'rgba(255,255,255,1)' }} /></div>
      )}
    </button>
  );

  React.useEffect(() => {
    let cancelled = false;
    const fetchNews = async () => {
      try {
        setIsLoading(true); setError("");
        const params = new URLSearchParams({ topic: selectedTopic });
        const res = await fetch(`/api/news?${params.toString()}`, { next: { revalidate: 30 } });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: NewsResponse = await res.json();
        if (!cancelled) {
          setItems(data.items); setTopic(data.topic); setTotalFeeds(data.totalFeeds); setLastUpdated(data.lastUpdated);
          setIsLoading(false); setRefreshProgress(0); triggerStaggeredAnimations();
          setRefreshEpochMs(Date.now());
          setLayoutSeed(Date.now());
        }
      } catch (err) {
        if (!cancelled) { setError(err instanceof Error ? err.message : "Failed to fetch news"); setIsLoading(false); }
      }
    };
    fetchNews();
    return () => { cancelled = true; };
  }, [selectedTopic]);

  React.useEffect(() => {
    if (isPaused || isLoading) return;
    const autoRefresh = async () => {
      if (isRefreshingRef.current) return;
      try {
        const params = new URLSearchParams({ topic: selectedTopic });
        const res = await fetch(`/api/news?${params.toString()}`, { next: { revalidate: 30 } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: NewsResponse = await res.json();
        const currentItemsHash = items.map(item => `${item.title}:${item.source}`).join('|');
        const newItemsHash = data.items.map(item => `${item.title}:${item.source}`).join('|');
        if (currentItemsHash === newItemsHash) {
          setLastUpdated(data.lastUpdated);
          setIsRefreshing(false);
          // Even if data didn't change, this is a refresh epoch for dots reset
          setRefreshProgress(0);
          setRefreshEpochMs(Date.now());
          setLayoutSeed(Date.now());
          return;
        }
        // Topic-style: fade rows out, then swap and stagger in
        setIsRefreshing(true);
        setTickerStates((prev) => prev.map(() => false));
        if (refreshSwapTimeoutRef.current) clearTimeout(refreshSwapTimeoutRef.current);
        refreshSwapTimeoutRef.current = window.setTimeout(() => {
          setItems(data.items);
          setTopic(data.topic);
          setTotalFeeds(data.totalFeeds);
          setLastUpdated(data.lastUpdated);
          setRefreshProgress(0);
          triggerStaggeredAnimations();
          setRefreshEpochMs(Date.now());
          setLayoutSeed(Date.now());
          setIsRefreshing(false);
        }, TOPIC_FADE_MS) as unknown as number;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch news");
        setIsRefreshing(false);
      }
    };
    const intervalId = setInterval(autoRefresh, NEWS_CONFIG.refreshInterval);
    return () => { clearInterval(intervalId); };
  }, [isPaused, isLoading, lastUpdated, selectedTopic, items]);

  // Robust refresh progress based on an explicit epoch we control (resets on manual and auto refresh)
  React.useEffect(() => {
    if (isLoading || isPaused) return;
    // Set initial progress based on epoch
    const now0 = Date.now();
    const elapsed0 = now0 - refreshEpochMs;
    setRefreshProgress(Math.max(0, Math.min((elapsed0 / NEWS_CONFIG.refreshInterval) * 100, 100)));
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - refreshEpochMs;
      const pct = (elapsed / NEWS_CONFIG.refreshInterval) * 100;
      setRefreshProgress(pct >= 100 ? 100 : pct);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading, isPaused, refreshEpochMs]);

  const createTickerRow = (sourceItems: NewsItem[], offset: number = 0) => {
    const source = (sourceItems || []).slice(offset);
    if (source.length === 0) {
      const placeholders = Array.from({ length: 25 }).map((_, i) => ({ id: `placeholder-${i}`, title: `Sample news headline ${i + 1} - This is a placeholder to ensure the ticker has enough content to move smoothly without jumps`, url: "#", source: `Source ${i + 1}` }));
      const copies = 2; const duplicated: typeof placeholders = []; for (let c = 0; c < copies; c++) duplicated.push(...placeholders); return duplicated;
    }
    const topArticles = source.slice(0, 20);
    const normalized = topArticles.map(item => { let t=item.title; if (t.length < 80) t=t.padEnd(80, " "); const s=(item.source||"News").padEnd(15, " "); return { ...item, title: t, source: s }; });
    const copies = 2; const dup: typeof normalized = []; for (let c=0;c<copies;c++) dup.push(...normalized); return dup;
  };

  const rowsData: NewsItem[][] = React.useMemo(() => {
    // Recompute layout on seed to reshuffle per-row starting offsets
    return Array.from({ length: rowCount }, (_, i) => createTickerRow(items, (i + (layoutSeed % 3)) % Math.max(1, items.length || 1)));
  }, [items, rowCount, layoutSeed]);

  const getRowStyle = (i: number): React.CSSProperties => {
    const isLeft = i % 2 === 0;
    const base = 420; const increment = 30; const speed = Math.max(0.5, Math.min(3, tickerSpeed)); const duration = (base + i * increment) / speed;
    return {
      animation: `${isLeft ? 'ticker-left' : 'ticker-right'} ${duration}s linear infinite`,
      transform: isLeft ? 'translateX(0)' : 'translateX(-50%)',
      minWidth: 'max-content', willChange: 'transform', backfaceVisibility: 'hidden', transformStyle: 'preserve-3d', perspective: '1000px',
      // Vary starting position slightly across refreshes to avoid identical placements
      animationDelay: `-${i * 15 + (layoutSeed % 10)}s`, contain: 'layout style paint', isolation: 'isolate'
    } as React.CSSProperties;
  };

  return (
    <div className={cn("w-full overflow-hidden bg-black text-white", className)}>
      {isLoading && (
        <div className="space-y-0">
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
                <div className="flex items-center gap-0.5">{Array.from({ length: 30 }).map((_, i) => (<div key={i} className="w-1.5 h-1.5 bg-white/10 rounded-full"></div>))}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="border-y border-white/10 pt-4 pb-2 sm:pt-8 sm:pb-4">
            <div className="flex items-center justify-between px-4 md:px-6">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:gap-3 flex-1">
                <span className="text-white/70 text-xs sm:text-sm" style={{ fontFamily: "var(--font-display)" }}>Topic</span>
                <div className={cn("relative", theme === 'light' ? "text-black" : "text-white")}>
                  <input
                    value={topicInput}
                    onChange={(e) => { setTopicInput(e.target.value); setIsTopicOpen(true); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { applyTopicInput(); setIsTopicOpen(false); } }}
                    onFocus={() => setIsTopicOpen(true)}
                    onBlur={() => { if (!ignoreBlurRef.current) { applyTopicInput(); setIsTopicOpen(false); } else { ignoreBlurRef.current = false; } }}
                    aria-label="Topic"
                    placeholder="topic…"
                    className={cn("w-[140px] sm:w-[200px] rounded px-2 py-1 focus:outline-none text-xs sm:text-sm", theme === 'light' ? "bg-black/5 border border-black/20 text-black/80 focus:ring-1 focus:ring-black/30" : "bg-black/40 border border-white/15 text-white/80 focus:ring-1 focus:ring-white/30")}
                  />
                  {topicRender && (
                    <div
                      ref={dropdownRef}
                      className={cn("absolute left-0 mt-2 w-[min(90vw,300px)] rounded-xl shadow-xl z-50 max-h-64 overflow-auto p-1 backdrop-blur-md backdrop-saturate-150", "transition-opacity ease-in-out", topicVisible ? "opacity-100" : "opacity-0 pointer-events-none")}
                      style={{ backgroundColor: 'var(--surface)', transitionDuration: `${topicVisible ? DROPDOWN_FADE_IN_MS : DROPDOWN_FADE_OUT_MS}ms`, willChange: 'opacity' }}
                      onMouseDown={() => { ignoreBlurRef.current = true; }}
                      onMouseUp={() => { setTimeout(() => { ignoreBlurRef.current = false; }, 0); }}
                    >
                      {topicInput.trim().length > 0 && !VALID_TOPICS.includes(topicInput.trim().toLowerCase()) && (
                        <button type="button" className={cn("w-full text-left px-3 py-2 rounded font-semibold", theme === 'light' ? "text-black hover:bg-black/10" : "text-white hover:bg-white/10")}
                          onClick={() => { setTopicInput(topicInput.trim()); applyTopicInput(); setIsTopicOpen(false); }}>
                          {topicInput.trim()}
                        </button>
                      )}
                      {VALID_TOPICS.map((t) => (
                        <button key={t} type="button" className={cn("w-full text-left px-3 py-2 rounded", theme === 'light' ? "text-black/80 hover:bg-black/10" : "text-white/80 hover:bg-white/10", t === selectedTopic ? (theme === 'light' ? "bg-black/10 text-black" : "bg-white/10 text-white") : "")} onClick={() => {
                          setTopicInput(t); setTickerStates((prev) => prev.map(() => false)); if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current); fadeTimeoutRef.current = window.setTimeout(() => { setSelectedTopic(t); setLastUpdated(new Date().toISOString()); }, TOPIC_FADE_MS) as unknown as number; setIsTopicOpen(false);
                        }}>{t}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="hidden sm:block text-white/40 text-xs sm:text-sm">•</div>
                <div className="hidden sm:block text-white/60 text-xs sm:text-sm">{totalFeeds} feeds</div>
              </div>
              <div className="flex w-full md:w-auto flex-col gap-1.5 items-end md:items-center md:flex-row md:gap-2">
                <div className="flex items-center flex-wrap gap-1.5 md:gap-2 justify-end">
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs text-white/60">Rows</span>
                    <input type="range" min={1} max={15} value={rowCount} onChange={(e) => setUserVisibleRows(Number(e.target.value))} className={cn("w-36 h-2 appearance-none rounded-full outline-none cursor-pointer", theme === 'light' ? "bg-black/15 [accent-color:black]" : "bg-white/10 [accent-color:white]")} />
                    <span className="text-xs text-white/60 w-6 text-right tabular-nums">{rowCount}</span>
                  </div>
                  <div className="md:hidden">
                    <select value={rowCount} onChange={(e) => setUserVisibleRows(Number(e.target.value))} className="min-w-[72px] shrink-0 bg-black/40 border border-white/15 rounded px-2 py-1 text-white/80 focus:outline-none focus:ring-1 focus:ring-white/30 text-xs">
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (<option key={n} value={n}>{n}</option>))}
                    </select>
                  </div>
                  <PlayPauseButton />
                  <button onClick={manualRefresh} disabled={isRefreshing} className={cn("w-5 h-5 rounded transition-all duration-200 hover:bg-white/10", isRefreshing ? "animate-spin" : "hover:scale-110")} title="Manual refresh">
                    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>
                  <div className="hidden md:block"><RefreshProgressBar /></div>
                </div>
                <div className="w-full md:hidden flex justify-end"><RefreshProgressBar /></div>
              </div>
            </div>
          </div>
          {/* Mobile-only feeds line */}
          <div className="sm:hidden px-4 md:px-6 text-right text-white/60 text-xs py-1">{totalFeeds} feeds</div>

          {/* Dim-only container: avoids double content by not rendering overlay */}
          <div className="relative" data-news-rows="base" style={{ contain: 'layout style paint' }}>
            {/* Base content (always visible) */}
            {rowsData.map((rowItems, i) => {
              const dimOpacity = isRefreshing && tickerStates[i] ? Math.max(0.5, 0.72 - i * 0.035) : undefined;
              return (
              <div key={`ticker-row-${i}`} className={cn(i === 0 ? "border-y border-white/10" : "border-b border-white/10", "transition-all duration-1200 ease-in-out", tickerStates[i] ? "opacity-100 translate-y-0 blur-0 scale-100" : "opacity-0 translate-y-4 blur-[2px] scale-[0.99]", isRefreshing && tickerStates[i] ? "blur-sm" : "")} style={dimOpacity !== undefined ? { opacity: dimOpacity } : undefined}> 
                <div className="relative">
                  <div className="flex whitespace-nowrap will-change-transform" style={getRowStyle(i)}>
                    {rowItems.map((item, idx) => (
                      <span key={`row${i}-${item.id}-${idx}`} className="flex items-center gap-2.5 md:gap-3 px-2.5 md:px-4 py-2 md:py-3 text-xs sm:text-sm md:text-base flex-shrink-0">
                        {item.source && (
                          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 md:px-3 py-0.5 md:py-1 text-[10px] sm:text-xs uppercase tracking-wide flex-shrink-0">
                            {item.source}
                          </span>
                        )}
                        <span className="mx-1 text-white/30 flex-shrink-0">•</span>
                        <Link href={item.url} target="_blank" className={cn("hover:underline transition-colors flex-1 whitespace-nowrap", item.url === "#" ? "text-white/50 cursor-default" : "text-white hover:text-white/80")} onClick={(e) => { if (item.url === "#") e.preventDefault(); }}>{item.title}</Link>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );})}

            <div className={cn("border-t border-white/10 bg-white/5 transition-all duration-1000 ease-out", tickerStates[rowCount - 1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4", isRefreshing ? "blur-sm" : "")} style={isRefreshing ? { opacity: 0.6 } : undefined}> 
              <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6">
                <div className="sm:hidden text-center text-[10px] text-white/50 mb-2">Mood analysis</div>
                <NewsMoodVisualizer items={items} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NewsTicker;

 