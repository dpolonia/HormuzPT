import { Router } from 'express';
import { fetchECB } from '../providers/ecb.js';
import { fetchMIBGAS } from '../providers/mibgas.js';
import { fetchOMIE } from '../providers/omie.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/energy-mix — MIBGAS + OMIE + ECB(TTF), TTL 6h
router.get('/energy-mix', cacheMiddleware(21600), async (_req, res) => {
    try {
        const [ttf, mibgas, omie] = await Promise.all([
            fetchECB('ttf_gas'),
            fetchMIBGAS(),
            fetchOMIE(),
        ]);

        res.json({
            source: 'ecb_ttf+mibgas+omie',
            updated_at: new Date().toISOString(),
            ttf,
            mibgas_spot: mibgas.spot,
            mibgas_day_ahead: mibgas.day_ahead,
            mibgas_date: mibgas.date,
            omie_pt_avg: omie.avg_pt_eur_mwh,
            omie_pt_min: omie.min_pt_eur_mwh,
            omie_pt_max: omie.max_pt_eur_mwh,
            omie_date: omie.date,
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
