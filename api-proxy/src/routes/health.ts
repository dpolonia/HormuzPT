import { Router } from 'express';

const router = Router();

// GET /health — Healthcheck endpoint
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'hormuzpt-api-proxy',
        timestamp: new Date().toISOString(),
    });
});

export default router;
