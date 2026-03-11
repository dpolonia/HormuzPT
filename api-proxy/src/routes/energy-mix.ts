import { Router } from 'express';
import { fetchECB } from '../providers/ecb.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/energy-mix — MIBGAS + OMIE + REN + ECB(TTF), TTL 6h
router.get('/energy-mix', cacheMiddleware(21600), async (_req, res) => {
    try {
        const ttf = await fetchECB('ttf_gas');
        // TODO: Add MIBGAS, OMIE, REN DataHub providers
        res.json({
            source: 'ecb_ttf+mibgas+omie+ren',
            updated_at: new Date().toISOString(),
            ttf,
            mibgas_spot: null,  // TODO: MIBGAS provider
            omie_pt_avg: null,  // TODO: OMIE provider
            mix: {
                petroleum: 0.415,
                gas: 0.185,
                renewables: 0.182,
                biomass: 0.160,
                other: 0.058,
            },
        });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch energy mix', detail: String(err) });
    }
});

export default router;
