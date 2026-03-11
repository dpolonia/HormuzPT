import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache.js';
import { config } from '../config.js';

const router = Router();

// GET /api/model-state — Current model state, TTL 1min
router.get('/model-state', cacheMiddleware(60), async (_req, res) => {
    try {
        const response = await fetch(`${config.recalibratorUrl}/model-state`);
        
        if (!response.ok) {
            throw new Error(`Upstream recalibrator returned HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        res.json({
            source: data.source || 'recalibrator-api',
            updated_at: new Date().toISOString(),
            state: data.state,
        });
    } catch (err) {
        console.error('[model-state] Error fetching from recalibrator:', err);
        res.status(502).json({ 
            error: 'Bad Gateway', 
            detail: 'Failed to access the downstream recalibration service.',
            message: String(err)
        });
    }
});

export default router;
