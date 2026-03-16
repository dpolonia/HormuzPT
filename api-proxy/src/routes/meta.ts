import { Router } from 'express';
import { getAllProviderStatuses } from '../utils/resilientFetch.js';

const router = Router();

// GET /api/meta — Dynamic provider status and timestamps
router.get('/meta', (_req, res) => {
    const statuses = getAllProviderStatuses();

    // Build a keyed map from provider name → status
    const sources: Record<string, any> = {};
    for (const s of statuses) {
        sources[s.name] = {
            status: s.status,
            lastSuccess: s.lastSuccess,
            lastError: s.lastError,
            stale: s.stale,
        };
    }

    res.json({
        service: 'hormuzpt-api-proxy',
        providers: sources,
        providerCount: statuses.length,
        liveCount: statuses.filter(s => s.status === 'live').length,
        staleCount: statuses.filter(s => s.status === 'stale').length,
        errorCount: statuses.filter(s => s.status === 'error').length,
        timestamp: new Date().toISOString(),
    });
});

export default router;
