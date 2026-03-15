/**
 * In-memory chat response cache with TTL.
 *
 * Key: SHA-256(normalizedQuestion | modelStateVersion)
 * TTL: 1 hour
 *
 * Only caches successful LLM responses — fallback responses are not cached
 * so that the next request retries the LLM.
 */

import { createHash } from 'crypto';

export interface CachedChatPayload {
  answer: string;
  model_meta: {
    provider: string;
    model: string;
    tier: string;
  };
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
}

interface CacheEntry {
  payload: CachedChatPayload;
  storedAt: number;
}

const CACHE_TTL_MS = 3_600_000; // 1 hour
const MAX_ENTRIES = 500; // prevent unbounded growth

const store = new Map<string, CacheEntry>();

/**
 * Build a deterministic cache key from the user question and model-state version.
 */
export function buildChatCacheKey(question: string, modelStateVersion: string): string {
  const normalized = question.toLowerCase().trim().replace(/\s+/g, ' ');
  const input = `${normalized}|${modelStateVersion}`;
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Look up a cached response. Returns null on miss or expiry.
 */
export function getCachedChat(key: string): CachedChatPayload | null {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
    store.delete(key);
    return null;
  }

  return entry.payload;
}

/**
 * Store a successful LLM response in the cache.
 */
export function setCachedChat(key: string, payload: CachedChatPayload): void {
  // Evict oldest entries if at capacity
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }

  store.set(key, { payload, storedAt: Date.now() });
}

/**
 * Clear all cached chat entries. Called on /api/refresh if needed.
 */
export function clearChatCache(): void {
  store.clear();
}

/**
 * Current cache size (for diagnostics).
 */
export function chatCacheSize(): number {
  return store.size;
}
