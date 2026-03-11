import { Router } from 'express';
import { fetchAllINE } from '../providers/ine.js';
import { fetchAllBPstat } from '../providers/bpstat.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/context — Macro panel (INE + BPstat), TTL 24h
router.get('/context', cacheMiddleware(86400), async (_req, res) => {
    try {
        const [ine, bpstat] = await Promise.all([fetchAllINE(), fetchAllBPstat()]);
        res.json({
            source: 'ine+bpstat',
            updated_at: new Date().toISOString(),
            ine,
            bpstat,
        });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch context data', detail: String(err) });
    }
});

export default router;
