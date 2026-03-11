import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/history — Changelog entries, TTL 5min
router.get('/history', cacheMiddleware(300), async (_req, res) => {
    try {
        // TODO: Read from GCS/Firestore in production
        res.json({
            source: 'local',
            updated_at: new Date().toISOString(),
            entries: [],
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history', detail: String(err) });
    }
});

export default router;
