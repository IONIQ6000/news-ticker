import "server-only";

export type CacheValue<T> = {
  value: T | null;
  updatedAtMs: number;
  staleAtMs: number;
  refreshing: boolean;
  lastError?: unknown;
};

export type Fetcher<T> = () => Promise<T>;

export type HeartbeatOptions = {
  ttlMs: number;
  minHeartbeatMs: number;
  maxRefreshMs?: number;
};

class HeartbeatCache<T> {
  private state: CacheValue<T>;
  private inFlight: Promise<void> | null = null;
  private readonly fetcher: Fetcher<T>;
  private readonly opts: Required<HeartbeatOptions>;

  constructor(fetcher: Fetcher<T>, opts: HeartbeatOptions) {
    this.fetcher = fetcher;
    this.opts = {
      maxRefreshMs: opts.maxRefreshMs ?? 20_000,
      minHeartbeatMs: opts.minHeartbeatMs,
      ttlMs: opts.ttlMs,
    };
    this.state = {
      value: null,
      updatedAtMs: 0,
      staleAtMs: 0,
      refreshing: false,
      lastError: undefined,
    };
  }

  private shouldRefresh(now: number): boolean {
    if (this.state.refreshing) return false;
    if (now - this.state.updatedAtMs < this.opts.minHeartbeatMs) return false;
    if (this.state.value === null) return true;
    return now >= this.state.staleAtMs;
  }

  private startRefresh(now: number): Promise<void> {
    if (this.inFlight) return this.inFlight;
    this.state.refreshing = true;
    const p = (async () => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        const timeout = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("refresh timed out")), this.opts.maxRefreshMs);
        });
        const result = await Promise.race([this.fetcher(), timeout]);
        this.state.value = result as T;
        this.state.updatedAtMs = now;
        this.state.staleAtMs = now + this.opts.ttlMs;
        this.state.lastError = undefined;
      } catch (err) {
        this.state.lastError = err;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        this.state.refreshing = false;
        this.inFlight = null;
      }
    })();
    this.inFlight = p;
    return p;
  }

  async get(triggerBackgroundRefresh = true): Promise<CacheValue<T>> {
    const now = Date.now();
    if (triggerBackgroundRefresh && this.shouldRefresh(now)) {
      void this.startRefresh(now);
    }
    return { ...this.state };
  }

  async forceRefresh(): Promise<CacheValue<T>> {
    const now = Date.now();
    await this.startRefresh(now);
    return { ...this.state };
  }
}

export function createHeartbeatCache<T>(fetcher: Fetcher<T>, opts: HeartbeatOptions) {
  return new HeartbeatCache<T>(fetcher, opts);
}

const globalSymbol = Symbol.for("heartbeat.cache.registry");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

type Registry = Record<string, HeartbeatCache<unknown>>;

if (!g[globalSymbol]) {
  g[globalSymbol] = {} as Registry;
}

export function getGlobalHeartbeatCache<T>(key: string): HeartbeatCache<T> | null {
  const reg = g[globalSymbol] as Registry;
  return (reg[key] as HeartbeatCache<T>) ?? null;
}

export function setGlobalHeartbeatCache<T>(key: string, cache: HeartbeatCache<T>): void {
  const reg = g[globalSymbol] as Registry;
  reg[key] = cache as unknown as HeartbeatCache<unknown>;
}

