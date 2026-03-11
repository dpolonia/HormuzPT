import { Router } from 'express';

const router = Router();

// GET /api/meta — Timestamps and status for all data sources
router.get('/meta', (_req, res) => {
    res.json({
        service: 'hormuzpt-api-proxy',
        sources: {
            ine: { status: 'stub', last_fetched: null },
            bpstat: { status: 'stub', last_fetched: null },
            ecb: { status: 'stub', last_fetched: null },
            eurostat: { status: 'stub', last_fetched: null },
            apiaberta: { status: 'stub', last_fetched: null },
            ense: { status: 'stub', last_fetched: null },
            mibgas: { status: 'stub', last_fetched: null },
            omie: { status: 'stub', last_fetched: null },
        },
        timestamp: new Date().toISOString(),
    });
});

export default router;
