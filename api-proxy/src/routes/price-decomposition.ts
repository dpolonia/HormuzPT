import { Router } from 'express';
import { fetchPriceDecomposition } from '../providers/ense.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/price-decomposition — ENSE-EPE decomposition, TTL 24h
router.get('/price-decomposition', cacheMiddleware(86400), async (_req, res) => {
    try {
        const decomposition = await fetchPriceDecomposition();
        res.json({
            source: 'ense-epe',
            updated_at: new Date().toISOString(),
            decomposition,
        });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch price decomposition', detail: String(err) });
    }
});

export default router;
