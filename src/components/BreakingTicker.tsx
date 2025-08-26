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
  const [lastFetchedAt, setLastFetchedAt] = React.useState<string>("");
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const sequenceRef = React.useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [distancePx, setDistancePx] = React.useState<number>(0);
  const [cycleKey, setCycleKey] = React.useState<number>(0);
  const { breakingSpeed } = useSettings();
  const FRESH_MS = 60 * 60 * 1000; // consider items fresh if within the last 60 minutes

  const getPublishedAtMs = React.useCallback((n: NewsItem): number => {
    if (!n.publishedAt) return 0;
    const t = Date.parse(n.publishedAt);
    return isNaN(t) ? 0 : t;
  }, []);

  const isFresh = React.useCallback((n: NewsItem): boolean => {
    const ts = getPublishedAtMs(n);
    if (!ts) return false;
    return Date.now() - ts <= FRESH_MS;
  }, [getPublishedAtMs]);

  // Fetch new items periodically, but do not reset UI; push to buffer
  const fetchBreaking = React.useCallback(async () => {
    if (isFetching) return;
    try {
      setIsFetching(true);
      const res = await fetch("/api/breaking", { next: { revalidate: 120 } });
      if (!res.ok) throw new Error(String(res.status));
      const data: ApiResponse = await res.json();
      setLastFetchedAt(data.lastUpdated);

      // Freshness gate + dedupe against current session
      const existingKeys = new Set<string>([
        ...items.map((n) => `${n.source}:${n.title}`),
        ...buffer.map((n) => `${n.source}:${n.title}`),
      ]);

      const incomingFresh = data.items
        .filter(isFresh)
        .filter((n) => !existingKeys.has(`${n.source}:${n.title}`));

      if (incomingFresh.length) {
        setBuffer((prev) => {
          // keep only fresh items in buffer, then append new fresh
          const kept = prev.filter(isFresh);
          return [...kept, ...incomingFresh];
        });
        // If ticker hasn't primed yet, prime immediately with whatever we have
        if (!isReady && items.length === 0) {
          const take = Math.min(20, incomingFresh.length);
          setItems(incomingFresh.slice(0, take));
          setBuffer((prev) => prev.slice(take));
        }
      }
    } catch {
      // ignore errors silently for this lightweight banner
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, items, buffer, isReady, isFresh]);

  // Initial fetch and interval
  React.useEffect(() => {
    fetchBreaking();
    const id = setInterval(fetchBreaking, 90_000);
    return () => clearInterval(id);
  }, [fetchBreaking]);

  // Prime items as soon as anything is available; do not render ticker until measured
  React.useEffect(() => {
    if (isReady) return;
    if (items.length === 0) {
      const freshBuffer = buffer.filter(isFresh);
      if (freshBuffer.length >= 1) {
        const take = Math.min(20, freshBuffer.length);
        setItems(freshBuffer.slice(0, take));
        // remove taken items by identity
        const takenIds = new Set(freshBuffer.slice(0, take).map(n => n.id));
        setBuffer((prev) => prev.filter(n => !takenIds.has(n.id)));
      }
    }
  }, [buffer, items.length, isReady, isFresh]);

  // Measure sequence width and mark ready, then fade in
  React.useEffect(() => {
    if (isReady) return;
    if (items.length === 0) return;
    const r = requestAnimationFrame(() => {
      const width = sequenceRef.current?.getBoundingClientRect().width || 0;
      if (width > 0) {
        setDistancePx(Math.ceil(width));
        setIsReady(true);
        // restart animation with measured distance
        setCycleKey(Date.now());
        // fade-in next frame
        requestAnimationFrame(() => setIsVisible(true));
      }
    });
    return () => cancelAnimationFrame(r);
  }, [items, isReady]);

  // At iteration boundaries, append from buffer and remesure to avoid speed creep
  const handleIteration = React.useCallback(() => {
    // Move a few new items in, drop a few old to keep list length bounded
    const freshBuffer = buffer.filter(isFresh);
    if (freshBuffer.length > 0) {
      const toShift = Math.min(6, freshBuffer.length);
      setItems((prev) => {
        const next = [...prev, ...freshBuffer.slice(0, toShift)];
        // keep last N to cap width growth
        const capped = next.slice(-200);
        return capped;
      });
      // remove the ones we appended from buffer by identity
      const takenIds = new Set(freshBuffer.slice(0, toShift).map(n => n.id));
      setBuffer((prev) => prev.filter(n => !takenIds.has(n.id)));
    }

    // Recalculate width for next cycle
    requestAnimationFrame(() => {
      const width = sequenceRef.current?.getBoundingClientRect().width || 0;
      if (width > 0) {
        setDistancePx(Math.ceil(width));
        // Bump key so the next cycle uses the new distance exactly
        setCycleKey(Date.now());
      }
    });
  }, [buffer]);

  const baseDurationSec = 140; // default speed
  const durationSec = baseDurationSec / Math.max(0.5, Math.min(3, breakingSpeed));
  const rowStyle: React.CSSProperties = {
    animation: `breaking-left ${durationSec}s linear infinite`,
    minWidth: "max-content",
    willChange: "transform",
    backfaceVisibility: "hidden",
    // CSS var as string
    ["--distance" as any]: String(distancePx),
  };

  return (
    <div className={cn("w-full bg-black text-white border-b border-white/10 font-mono", className)}>
      <div className="mx-auto max-w-full">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 pt-1.5 sm:pt-2 text-[9px] sm:text-[10px] uppercase tracking-wider text-white/50">
          <span className="text-white/70">Global Breaking Headlines</span>
          <span className="hidden md:inline text-white/30">•</span>
          <span className="hidden md:inline text-white/40">Live, continuous scroll</span>
        </div>
        {/* Placeholder until ready */}
        {!isReady && (
          <div className="px-3 sm:px-4 py-2 sm:py-3">
            <div className="w-full rounded bg-white/5 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
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
        {/* Hidden measurement sequence (always mounted) */}
        <div className="absolute opacity-0 pointer-events-none -z-10" aria-hidden>
          <div ref={sequenceRef} className="flex whitespace-nowrap">
            {items.map((item, idx) => (
              <span key={`m-${item.id}-${idx}`} className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-sm md:text-lg font-semibold">
                {item.source ? (
                  <span className="inline-flex items-center rounded bg-white/15 px-2 py-0.5 text-[9px] md:text-[10px] uppercase tracking-wide">
                    {item.source}
                  </span>
                ) : null}
                <span className="text-white/60">{item.title}</span>
                <span className="mx-2 md:mx-3 text-white/30">•</span>
              </span>
            ))}
          </div>
        </div>
        {/* Ticker (hidden until fully measured and then fades in) */}
        {isReady && (
          <div className={cn(
            "relative overflow-hidden transition-all duration-1000 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div
              key={cycleKey}
              ref={trackRef}
              className="flex whitespace-nowrap"
              style={rowStyle}
              onAnimationIteration={handleIteration}
            >
              {/* duplicate sequence for seamless loop */}
              <div className="flex">
                {items.map((item, idx) => (
                  <span key={`a-${item.id}-${idx}`} className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-sm md:text-lg font-semibold">
                    {item.source ? (
                      <span className="inline-flex items-center rounded bg-white/15 px-2 py-0.5 text-[9px] md:text-[10px] uppercase tracking-wide">
                        {item.source}
                      </span>
                    ) : null}
                    {item.url === "#" ? (
                      <span className="text-white/60">{item.title}</span>
                    ) : (
                      <Link href={item.url} target="_blank" className="hover:underline">
                        {item.title}
                      </Link>
                    )}
                    <span className="mx-2 md:mx-3 text-white/30">•</span>
                  </span>
                ))}
              </div>
              <div className="flex">
                {items.map((item, idx) => (
                  <span key={`b-${item.id}-${idx}`} className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-sm md:text-lg font-semibold">
                    {item.source ? (
                      <span className="inline-flex items-center rounded bg-white/15 px-2 py-0.5 text-[9px] md:text-[10px] uppercase tracking-wide">
                        {item.source}
                      </span>
                    ) : null}
                    {item.url === "#" ? (
                      <span className="text-white/60">{item.title}</span>
                    ) : (
                      <Link href={item.url} target="_blank" className="hover:underline">
                        {item.title}
                      </Link>
                    )}
                    <span className="mx-2 md:mx-3 text-white/30">•</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* keyframes */}
      <style jsx>{`
        @keyframes breaking-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(var(--distance) * -1px)); }
        }
      `}</style>
    </div>
  );
}


