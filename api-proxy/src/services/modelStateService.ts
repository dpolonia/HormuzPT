/**
 * Shared model-state retrieval service.
 *
 * Used by both /api/model-state and /api/chat to avoid localhost HTTP self-calls.
 *
 * Resolution order:
 *   1. In-memory cache (60s TTL)
 *   2. Upstream recalibrator HTTP call
 *   3. Local file fallback (data/model_state_initial.json)
 */

import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { ModelStateEnvelope, ModelStatePayload } from '../types/modelState.js';

// ── In-memory cache ──────────────────────────────────────────────
const CACHE_TTL_MS = 60_000; // 60 seconds

let cachedState: ModelStateEnvelope | null = null;
let cachedAt = 0;

function isCacheFresh(): boolean {
  return cachedState !== null && Date.now() - cachedAt < CACHE_TTL_MS;
}

// ── Upstream fetch (recalibrator) ────────────────────────────────
async function fetchFromRecalibrator(): Promise<ModelStateEnvelope> {
  const url = `${config.recalibratorUrl}/model-state`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Recalibrator returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      source?: string;
      state?: ModelStatePayload;
    };

    if (!data.state || typeof data.state !== 'object') {
      throw new Error('Recalibrator response missing "state" object');
    }

    return {
      source: data.source || 'recalibrator',
      updated_at: new Date().toISOString(),
      version: (data.state.version as string) || 'unknown',
      state: data.state,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Local file fallback ──────────────────────────────────────────
function loadFromFile(): ModelStateEnvelope {
  // Try both api-proxy/data/ (Docker) and ../data/ (repo root)
  const candidates = [
    path.join(process.cwd(), 'data', 'model_state_initial.json'),
    path.resolve(process.cwd(), '..', 'data', 'model_state_initial.json'),
  ];

  const filePath = candidates.find(p => fs.existsSync(p));

  if (!filePath) {
    throw new Error(`Local model state file not found. Searched: ${candidates.join(', ')}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const state = JSON.parse(raw) as ModelStatePayload;

  return {
    source: 'local-file',
    updated_at: new Date().toISOString(),
    version: (state.version as string) || 'unknown',
    state,
  };
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Returns the current model state, using cache → recalibrator → local file.
 * Never throws — falls through to local file as last resort.
 */
export async function getModelState(): Promise<ModelStateEnvelope> {
  // 1. Cache hit
  if (isCacheFresh()) {
    return cachedState!;
  }

  // 2. Try recalibrator
  try {
    const result = await fetchFromRecalibrator();
    cachedState = result;
    cachedAt = Date.now();
    return result;
  } catch (err) {
    console.warn('[modelStateService] Recalibrator unavailable, using local fallback:', String(err));
  }

  // 3. Local file fallback
  try {
    const result = loadFromFile();
    cachedState = result;
    cachedAt = Date.now();
    return result;
  } catch (err) {
    console.error('[modelStateService] Local file fallback also failed:', String(err));
    throw new Error('Unable to load model state from any source');
  }
}

/**
 * Invalidates the in-memory cache, forcing the next call to re-fetch.
 */
export function invalidateModelStateCache(): void {
  cachedState = null;
  cachedAt = 0;
}
