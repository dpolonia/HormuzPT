import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache.js';
import { getModelState } from '../services/modelStateService.js';

const router = Router();

// GET /api/model-state — Current model state, TTL 1min
router.get('/model-state', cacheMiddleware(60), async (_req, res) => {
  try {
    const envelope = await getModelState();
    res.json(envelope);
  } catch (error) {
    console.error('[model-state] Failed to load model state:', error);
    res.status(500).json({
      error: 'Failed to retrieve model state',
    });
  }
});

export default router;
