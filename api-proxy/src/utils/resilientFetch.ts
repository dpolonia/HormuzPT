/**
 * Resilient fetch utility for external data providers.
 *
 * Features:
 *   - Configurable timeout (default 8s)
 *   - Retry with backoff (default 1 retry)
 *   - In-memory TTL cache with stale fallback
 *   - Provider status tracking
 */

export interface ProviderStatus {
    name: string;
    status: 'live' | 'stale' | 'error' | 'stub';
    lastSuccess: string | null;
    lastError: string | null;
    stale: boolean;
}

interface CacheEntry<T> {
    data: T;
    fetchedAt: number;
    ttl: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const statusMap = new Map<string, ProviderStatus>();

/** Get or initialize a provider status entry */
export function getProviderStatus(name: string): ProviderStatus {
    let s = statusMap.get(name);
    if (!s) {
        s = { name, status: 'stub', lastSuccess: null, lastError: null, stale: false };
        statusMap.set(name, s);
    }
    return s;
}

/** Get all tracked provider statuses */
export function getAllProviderStatuses(): ProviderStatus[] {
    return Array.from(statusMap.values());
}

/** Mark a provider as successfully fetched */
function markSuccess(name: string): void {
    const s = getProviderStatus(name);
    s.status = 'live';
    s.lastSuccess = new Date().toISOString();
    s.stale = false;
}

/** Mark a provider as errored */
function markError(name: string, err: string): void {
    const s = getProviderStatus(name);
    s.lastError = `${new Date().toISOString()} — ${err}`;
    // If we have cached data, mark stale; otherwise error
    s.stale = s.lastSuccess !== null;
    s.status = s.stale ? 'stale' : 'error';
}

export interface ResilientFetchOpts {
    /** Cache key (must be unique per distinct request) */
    cacheKey: string;
    /** Provider name for status tracking */
    provider: string;
    /** Timeout per attempt in ms (default 8000) */
    timeoutMs?: number;
    /** Number of retries on transient failure (default 1) */
    retries?: number;
    /** Cache TTL in ms (default 6h) */
    ttlMs?: number;
    /** Request headers */
    headers?: Record<string, string>;
}

const DEFAULT_TIMEOUT = 8_000;
const DEFAULT_RETRIES = 1;
const DEFAULT_TTL = 6 * 60 * 60 * 1_000; // 6 hours

/**
 * Fetch JSON from a URL with timeout, retry, caching, and stale fallback.
 * Returns parsed JSON or null on failure (never throws).
 */
export async function resilientFetchJson<T = any>(
    url: string,
    opts: ResilientFetchOpts,
): Promise<{ data: T | null; stale: boolean }> {
    const { cacheKey, provider } = opts;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
    const retries = opts.retries ?? DEFAULT_RETRIES;
    const ttlMs = opts.ttlMs ?? DEFAULT_TTL;

    // 1. Check cache
    const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.fetchedAt < cached.ttl) {
        // Cache is still fresh — mark live and return
        const s = getProviderStatus(provider);
        s.status = 'live';
        s.stale = false;
        return { data: cached.data, stale: false };
    }

    // 2. Fetch with retries
    let lastErr = '';
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            const resp = await fetch(url, {
                signal: controller.signal,
                headers: opts.headers,
            });
            clearTimeout(timer);

            if (!resp.ok) {
                lastErr = `HTTP ${resp.status}`;
                continue;
            }

            const data = (await resp.json()) as T;
            // Store in cache
            cache.set(cacheKey, { data, fetchedAt: Date.now(), ttl: ttlMs });
            markSuccess(provider);
            return { data, stale: false };
        } catch (err: any) {
            lastErr = err?.name === 'AbortError' ? 'timeout' : String(err);
            // Brief pause before retry
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            }
        }
    }

    // 3. All attempts failed — try stale cache
    console.warn(`[${provider}] fetch failed (${lastErr}), key=${cacheKey}`);
    markError(provider, lastErr);

    if (cached) {
        return { data: cached.data, stale: true };
    }

    return { data: null, stale: false };
}

/**
 * Fetch raw text/CSV from a URL with the same resilience layer.
 */
export async function resilientFetchText(
    url: string,
    opts: ResilientFetchOpts,
): Promise<{ data: string | null; stale: boolean }> {
    const { cacheKey, provider } = opts;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
    const retries = opts.retries ?? DEFAULT_RETRIES;
    const ttlMs = opts.ttlMs ?? DEFAULT_TTL;

    const cached = cache.get(cacheKey) as CacheEntry<string> | undefined;
    if (cached && Date.now() - cached.fetchedAt < cached.ttl) {
        const s = getProviderStatus(provider);
        s.status = 'live';
        s.stale = false;
        return { data: cached.data, stale: false };
    }

    let lastErr = '';
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            const resp = await fetch(url, {
                signal: controller.signal,
                headers: opts.headers,
            });
            clearTimeout(timer);

            if (!resp.ok) {
                lastErr = `HTTP ${resp.status}`;
                continue;
            }

            const data = await resp.text();
            cache.set(cacheKey, { data, fetchedAt: Date.now(), ttl: ttlMs });
            markSuccess(provider);
            return { data, stale: false };
        } catch (err: any) {
            lastErr = err?.name === 'AbortError' ? 'timeout' : String(err);
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            }
        }
    }

    console.warn(`[${provider}] text fetch failed (${lastErr}), key=${cacheKey}`);
    markError(provider, lastErr);

    if (cached) {
        return { data: cached.data, stale: true };
    }

    return { data: null, stale: false };
}
