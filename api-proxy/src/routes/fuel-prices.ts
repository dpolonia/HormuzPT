import { Router } from 'express';
import { fetchFuelPrices } from '../providers/apiaberta.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// GET /api/fuel-prices — Real fuel prices from API Aberta, TTL 6h
router.get('/fuel-prices', cacheMiddleware(21600), async (req, res) => {
    try {
        const fuelType = req.query.type as string | undefined;
        const prices = await fetchFuelPrices(fuelType);
        res.json({
            source: 'apiaberta',
            updated_at: new Date().toISOString(),
            prices,
        });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch fuel prices', detail: String(err) });
    }
});

export default router;
