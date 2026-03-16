import { Router } from 'express';
import { fetchBPstat } from '../providers/bpstat.js';
import { fetchEurostat } from '../providers/eurostat.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/budget — Budget execution data (BPstat + Eurostat), TTL 24h
router.get('/budget', cacheMiddleware(86400), async (_req, res) => {
    try {
        const [publicDebt, debtInterest, taxRevenue, eurostatDebt] = await Promise.all([
            fetchBPstat('public_debt'),
            fetchBPstat('debt_interest'),
            fetchBPstat('tax_revenue'),
            fetchEurostat('public_debt'),
        ]);
        res.json({
            source: 'bpstat+eurostat',
            updated_at: new Date().toISOString(),
            publicDebt,
            debtInterest,
            taxRevenue,
            eurostatDebt,
        });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch budget data', detail: String(err) });
    }
});

export default router;
