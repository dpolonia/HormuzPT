import { Router } from 'express';
import { fetchAllEurostat, fetchEurostat } from '../providers/eurostat.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/comparison — EU comparison data (Eurostat), TTL 24h
router.get('/comparison', cacheMiddleware(86400), async (_req, res) => {
    try {
        const [hicpEu, publicDebt] = await Promise.all([
            fetchEurostat('hicp_eu'),
            fetchEurostat('public_debt'),
        ]);
        res.json({
            source: 'eurostat',
            updated_at: new Date().toISOString(),
            datasets: [hicpEu, publicDebt],
        });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch comparison data', detail: String(err) });
    }
});

export default router;
