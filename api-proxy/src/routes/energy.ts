import { Router } from 'express';
import { fetchECB } from '../providers/ecb.js';
import { fetchINE } from '../providers/ine.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/energy — Energy prices/volumes (ECB + INE), TTL 6h
router.get('/energy', cacheMiddleware(21600), async (_req, res) => {
    try {
        const [brent, ttf, eurUsd, fuelSales] = await Promise.all([
            fetchECB('brent'),
            fetchECB('ttf_gas'),
            fetchECB('eur_usd'),
            fetchINE('fuel_sales'),
        ]);
        res.json({
            source: 'ecb+ine',
            updated_at: new Date().toISOString(),
            brent,
            ttf,
            eurUsd,
            fuelSales,
        });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch energy data', detail: String(err) });
    }
});

export default router;
