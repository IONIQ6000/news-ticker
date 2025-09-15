"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/SettingsProvider";

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
};

type ApiResponse = {
  items: NewsItem[];
  totalFeeds: number;
  lastUpdated: string;
};

export function BreakingTicker({ className }: { className?: string }) {
  const [items, setItems] = React.useState<NewsItem[]>([]);
  const [buffer, setBuffer] = React.useState<NewsItem[]>([]);
  const [isFetching, setIsFetching] = React.useState<boolean>(false);
  const sequenceRef = React.useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [distancePx, setDistancePx] = React.useState<number>(0);
  const [cycleKey, setCycleKey] = React.useState<number>(0);
  const { breakingSpeed } = useSettings();
  const FRESH_MS = 60 * 60 * 1000;
  const MIN_UNIQUE = 8;
  const lastFetchedRef = React.useRef<NewsItem[]>([]);

  const getPublishedAtMs = React.useCallback((n: NewsItem): number => {
    if (!n.publishedAt) return 0;
    const t = Date.parse(n.publishedAt);
    return isNaN(t) ? 0 : t;
  }, []);

  const isFresh = React.useCallback((n: NewsItem): boolean => {
    const ts = getPublishedAtMs(n);
    if (!ts) return false;
    return Date.now() - ts <= FRESH_MS;
  }, [getPublishedAtMs, FRESH_MS]);

  const normalizeTitle = React.useCallback((t: string): string => {
    const s = (t || "")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      // strip common site suffixes
      .replace(/\s*[-|–—:]\s*[^\s].*$/u, "")
      .toLowerCase()
      .replace(/[“”"'’]+/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    return s;
  }, []);

  const getKey = React.useCallback((n: NewsItem): string => {
    return normalizeTitle(n.title || "");
  }, [normalizeTitle]);

  const fetchBreaking = React.useCallback(async () => {
    // Window-scoped dedupe to avoid bursts from multiple instances/HMR
    const w = typeof window !== 'undefined' ? (window as unknown as { __breakingFetch?: { inFlight: boolean; lastAt: number } }) : undefined;
    if (w && !w.__breakingFetch) w.__breakingFetch = { inFlight: false, lastAt: 0 };
    const now = Date.now();
    if (w && w.__breakingFetch) {
      if (w.__breakingFetch.inFlight) return;
      if (now - w.__breakingFetch.lastAt < 5_000) return;
      w.__breakingFetch.inFlight = true;
    } else {
      if (isFetching) return;
    }
    try {
      setIsFetching(true);
      const res = await fetch("/api/breaking", {
        // Use default browser cache with ETag support
        cache: "default",
        headers: {
          // Avoid Next's RSC cache; rely on our route cache + browser cache
          "pragma": "no-cache",
          "cache-control": "no-cache",
        },
      });
      if (!res.ok) throw new Error(String(res.status));
      const data: ApiResponse = await res.json();
      lastFetchedRef.current = data.items || [];
      // Build robust de-dup set using normalized title-only key
      const existingKeys = new Set<string>([
        ...items.map((n) => getKey(n)),
        ...buffer.map((n) => getKey(n)),
      ]);

      // Unique incoming (prefer first occurrence) and fresh-first
      const seenIncoming = new Set<string>();
      const incomingUnique = (data.items || []).filter((n) => {
        const k = getKey(n);
        if (!k) return false;
        if (seenIncoming.has(k)) return false;
        seenIncoming.add(k);
        return true;
      });

      const incomingFresh = incomingUnique.filter(isFresh).filter((n) => !existingKeys.has(getKey(n)));

      if (incomingFresh.length) {
        setBuffer((prev) => {
          const kept = prev.filter(isFresh);
          return [...kept, ...incomingFresh];
        });
        if (!isReady && items.length === 0) {
          const take = Math.min(20, incomingFresh.length);
          setItems(incomingFresh.slice(0, take));
          setBuffer((prev) => prev.slice(take));
        }
      }

      // Ensure we keep a minimum variety in items; if too few, backfill with non-fresh unique from last fetch
      const ensureMinimumVariety = () => {
        setItems((prev) => {
          const currentKeys = new Set(prev.map(getKey));
          if (currentKeys.size >= MIN_UNIQUE) return prev;
          const candidates = lastFetchedRef.current
            .filter((n) => !!getKey(n))
            .filter((n) => !currentKeys.has(getKey(n)));
          if (candidates.length === 0) return prev;
          const needed = MIN_UNIQUE - currentKeys.size;
          const toAdd = candidates.slice(0, Math.max(0, needed));
          return [...prev, ...toAdd];
        });
      };

      ensureMinimumVariety();
    } catch {
    } finally {
      setIsFetching(false);
      if (w && w.__breakingFetch) {
        w.__breakingFetch.lastAt = Date.now();
        w.__breakingFetch.inFlight = false;
      }
    }
  }, [isFetching, items, buffer, isReady, isFresh]);

  React.useEffect(() => {
    let scheduled = false;
    const tick = async () => {
      if (scheduled) return;
      scheduled = true;
      try { await fetchBreaking(); } finally { scheduled = false; }
    };
    const start = () => {
      void tick();
      const w = window as unknown as { __breakingPollId?: number };
      if (!w.__breakingPollId) {
        w.__breakingPollId = window.setInterval(tick, 180_000);
      }
    };
    const stop = () => {
      const w = window as unknown as { __breakingPollId?: number };
      if (w.__breakingPollId) {
        clearInterval(w.__breakingPollId);
        w.__breakingPollId = undefined;
      }
      scheduled = false;
    };
    if (typeof document !== 'undefined') {
      if (document.visibilityState === 'visible') start();
      const onVis = () => { if (document.visibilityState === 'visible') start(); else stop(); };
      document.addEventListener('visibilitychange', onVis);
      return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
    }
    start();
    return () => stop();
  }, [fetchBreaking]);

  React.useEffect(() => {
    if (isReady) return;
    if (items.length === 0) {
      const freshBuffer = buffer.filter(isFresh);
      let seed: NewsItem[] = [];
      if (freshBuffer.length >= 1) {
        const take = Math.min(20, freshBuffer.length);
        seed = freshBuffer.slice(0, take);
        const takenIds = new Set(seed.map(n => n.id));
        setBuffer((prev) => prev.filter(n => !takenIds.has(n.id)));
      } else if (lastFetchedRef.current.length) {
        // Fallback: seed from last fetched unique items even if not fresh
        const seen = new Set<string>();
        for (const n of lastFetchedRef.current) {
          const k = getKey(n);
          if (!k || seen.has(k)) continue;
          seen.add(k);
          seed.push(n);
          if (seed.length >= MIN_UNIQUE) break;
        }
      }
      if (seed.length) setItems(seed);
    }
  }, [buffer, items.length, isReady, isFresh]);

  React.useEffect(() => {
    if (isReady) return;
    if (items.length === 0) return;
    const r = requestAnimationFrame(() => {
      const width = sequenceRef.current?.getBoundingClientRect().width || 0;
      if (width > 0) {
        setDistancePx(Math.ceil(width));
        setIsReady(true);
        setCycleKey(Date.now());
        requestAnimationFrame(() => setIsVisible(true));
      }
    });
    return () => cancelAnimationFrame(r);
  }, [items, isReady]);

  const handleIteration = React.useCallback(() => {
    const freshBuffer = buffer.filter(isFresh);
    if (freshBuffer.length > 0) {
      const toShift = Math.min(6, freshBuffer.length);
      setItems((prev) => {
        const merged = [...prev, ...freshBuffer.slice(0, toShift)];
        // Deduplicate by normalized key while preserving order and cap size
        const seen = new Set<string>();
        const deduped: NewsItem[] = [];
        for (const n of merged) {
          const k = getKey(n);
          if (!k || seen.has(k)) continue;
          seen.add(k);
          deduped.push(n);
        }
        return deduped.slice(-200);
      });
      const takenIds = new Set(freshBuffer.slice(0, toShift).map(n => n.id));
      setBuffer((prev) => prev.filter(n => !takenIds.has(n.id)));
    } else {
      // If buffer empty and variety too small, backfill from last fetch
      setItems((prev) => {
        const currentKeys = new Set(prev.map(getKey));
        if (currentKeys.size >= MIN_UNIQUE) return prev;
        const add: NewsItem[] = [];
        for (const n of lastFetchedRef.current) {
          const k = getKey(n);
          if (!k || currentKeys.has(k)) continue;
          currentKeys.add(k);
          add.push(n);
          if (currentKeys.size >= MIN_UNIQUE) break;
        }
        return add.length ? [...prev, ...add] : prev;
      });
    }

    requestAnimationFrame(() => {
      const width = sequenceRef.current?.getBoundingClientRect().width || 0;
      if (width > 0) {
        setDistancePx(Math.ceil(width));
        setCycleKey(Date.now());
      }
    });
  }, [buffer, isFresh]);

  // Compute duration from measured distance to keep constant px/s regardless of content width
  const basePxPerSec = 60; // adjust for global speed baseline
  const speedFactor = Math.max(0.5, Math.min(3, breakingSpeed));
  const durationSec = distancePx > 0
    ? distancePx / (basePxPerSec * speedFactor)
    : 140 / speedFactor;
  const rowStyle: React.CSSProperties & { ['--distance']?: string } = {
    animation: `breaking-left ${durationSec}s linear infinite`,
    minWidth: "max-content",
    willChange: "transform",
    backfaceVisibility: "hidden",
    ['--distance']: String(distancePx),
  };

  return (
    <div className={cn("w-full bg-black text_white border-b border-white/10", className)}>
      <div className="mx-auto max-w-full">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-3 px-2.5 sm:px-4 pt-1.5 sm:pt-2 text-[9px] sm:text-[10px] uppercase tracking-wider text-white/50">
          <span className="text-white/70">Global Breaking Headlines</span>
          <span className="hidden md:inline text_white/30">•</span>
          <span className="hidden md:inline text-white/40">Live, continuous scroll</span>
        </div>
        {!isReady && (
          <div className="px-3 sm:px-4 py-2 sm:py-3">
            <div className="w-full rounded bg-white/5 border border_white/10 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                <span className="inline-flex items-center rounded bg-white/20 px-2 py-0.5 text-[9px] sm:text-[10px] uppercase tracking-wide text-white/90">Live Breaking</span>
                <span className="text-white/90 text-xs sm:text-sm font-medium">Preparing live global headlines…</span>
              </div>
              <div className="text-white/45 text-[9px] sm:text-[10px] uppercase tracking-wide hidden sm:block">
                AP • BBC • Euronews • Le Monde • TIME
              </div>
            </div>
          </div>
        )}
        <div className="absolute opacity-0 pointer-events-none -z-10" aria-hidden>
          <div ref={sequenceRef} className="flex whitespace-nowrap">
            {items.map((item, idx) => (
              <span key={`m-${item.id}-${idx}`} className="flex items-center gap-2 md:gap-2.5 px-2.5 md:px-4 py-2 md:py-3 text-sm md:text-lg font-semibold">
                {item.source ? (
                  <span className="inline-flex items-center rounded bg-white/15 px-2 py-0.5 text-[9px] md:text-[10px] uppercase tracking-wide">
                    {item.source}
                  </span>
                ) : null}
                <span className="mx-1.5 text-white/30">•</span>
                <span className="text-white/60 whitespace-nowrap">{item.title}</span>
              </span>
            ))}
          </div>
        </div>
        {isReady && (
          <div className={cn(
            "relative overflow-hidden transition-all duration-1000 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div
              key={cycleKey}
              className="flex whitespace-nowrap"
              style={rowStyle}
              onAnimationIteration={handleIteration}
            >
              <div className="flex">
                {items.map((item, idx) => (
                  <span key={`a-${item.id}-${idx}`} className="flex items-center gap-2 md:gap-2.5 px-2.5 md:px-4 py-2 md:py-3 text-sm md:text-lg font-semibold">
                    {item.source ? (
                      <span className="inline-flex items-center rounded bg-white/15 px-2 py-0.5 text-[9px] md:text-[10px] uppercase tracking-wide">
                        {item.source}
                      </span>
                    ) : null}
                    <span className="mx-1.5 text-white/30">•</span>
                    {item.url === "#" ? (
                      <span className="text_white/60 whitespace-nowrap">{item.title}</span>
                    ) : (
                      <Link href={item.url} target="_blank" className="hover:underline whitespace-nowrap">
                        {item.title}
                      </Link>
                    )}
                  </span>
                ))}
              </div>
              <div className="flex">
                {items.map((item, idx) => (
                  <span key={`b-${item.id}-${idx}`} className="flex items-center gap-2 md:gap-2.5 px-2.5 md:px-4 py-2 md:py-3 text-sm md:text-lg font-semibold">
                    {item.source ? (
                      <span className="inline-flex items-center rounded bg-white/15 px-2 py-0.5 text-[9px] md:text-[10px] uppercase tracking-wide">
                        {item.source}
                      </span>
                    ) : null}
                    <span className="mx-1.5 text-white/30">•</span>
                    {item.url === "#" ? (
                      <span className="text_white/60 whitespace-nowrap">{item.title}</span>
                    ) : (
                      <Link href={item.url} target="_blank" className="hover:underline whitespace-nowrap">
                        {item.title}
                      </Link>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes breaking-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(var(--distance) * -1px)); }
        }
      `}</style>
    </div>
  );
}

export default BreakingTicker;
