/**
 * ModelState — type definitions for the api-proxy model state service.
 *
 * The full model parameters live as a Record<string, unknown> because
 * the canonical type definition is in the frontend (frontend/src/model/types.ts).
 * The api-proxy only needs to pass the state through, not interpret every field.
 */

/** Raw model parameters (30+ numeric fields, multiplier maps, etc.) */
export type ModelStatePayload = Record<string, unknown>;

/** Envelope returned by getModelState() and served by /api/model-state */
export interface ModelStateEnvelope {
  source: string;
  updated_at: string;
  version: string;
  state: ModelStatePayload;
}
