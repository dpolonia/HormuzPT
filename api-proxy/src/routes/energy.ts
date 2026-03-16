import { Router } from 'express';
import { fetchECB } from '../providers/ecb.js';
import { fetchEurostat } from '../providers/eurostat.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/energy — Energy prices/volumes (ECB + Eurostat), TTL 6h
router.get('/energy', cacheMiddleware(21600), async (_req, res) => {
    try {
        const [brent, ttf, eurUsd, energyDep] = await Promise.all([
            fetchECB('brent'),
            fetchECB('ttf_gas'),
            fetchECB('eur_usd'),
            fetchEurostat('energy_dependency'),
        ]);
        res.json({
            source: 'ecb+eurostat',
            updated_at: new Date().toISOString(),
            brent,
            ttf,
            eurUsd,
            energyDependency: energyDep,
        });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch energy data', detail: String(err) });
    }
});

export default router;
