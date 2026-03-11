import { Router } from 'express';
import { clearCache } from '../middleware/cache.js';

const router = Router();

// POST /api/refresh — Force refresh all caches
router.post('/refresh', async (_req, res) => {
    try {
        clearCache();
        res.json({
            status: 'ok',
            message: 'Cache cleared, data will be re-fetched on next request',
            refreshed_at: new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({ error: 'Refresh failed', detail: String(err) });
    }
});

export default router;
