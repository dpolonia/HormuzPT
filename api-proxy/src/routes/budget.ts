import { Router } from 'express';
import { fetchBPstat } from '../providers/bpstat.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/budget — Budget execution data (BPstat + dados.gov.pt), TTL 24h
router.get('/budget', cacheMiddleware(86400), async (_req, res) => {
    try {
        const [publicDebt, debtInterest, taxRevenue] = await Promise.all([
            fetchBPstat('public_debt'),
            fetchBPstat('debt_interest'),
            fetchBPstat('tax_revenue'),
        ]);
        res.json({
            source: 'bpstat+dadosgov',
            updated_at: new Date().toISOString(),
            publicDebt,
            debtInterest,
            taxRevenue,
        });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch budget data', detail: String(err) });
    }
});

export default router;
