import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { logAudit } from '../utils/logger.js';

const router = Router();

// Ensure connection to the shared history database
const dbDir = path.join(process.cwd(), 'data');
const db = new Database(path.join(dbDir, 'history.sqlite'));

// GET /api/stats/cost — Calculate 7-day rolling cost vs Limit
router.get('/cost', (req: Request, res: Response) => {
    try {
        // We look for 'qna' actions logged by chat.ts
        const stmt = db.prepare(`
            SELECT details FROM history_events 
            WHERE action = 'qna' 
            AND timestamp > datetime('now', '-7 days')
        `);
        
        const historyEvents = stmt.all() as { details: string }[];
        let totalCostUsd = 0;

        for (const event of historyEvents) {
            if (event.details) {
                try {
                    const parsed = JSON.parse(event.details);
                    if (parsed.cost_usd) {
                        totalCostUsd += parseFloat(parsed.cost_usd);
                    }
                } catch {
                    // Ignore malformed JSON detail rows
                }
            }
        }

        const maxLimitUsd = parseFloat(process.env.MAX_WEEKLY_LLM_COST_USD || '10.0');

        res.json({
            period_days: 7,
            total_cost_usd: Math.round(totalCostUsd * 1000) / 1000,
            max_limit_usd: maxLimitUsd,
            percentage_used: Math.round((totalCostUsd / maxLimitUsd) * 100),
        });

        // 11.3: Private Audit Log (File structure)
        logAudit({
            ip: req.ip || '0.0.0.0',
            route: '/api/stats/cost',
            method: 'GET',
            action: 'View Dashboard Costs',
            userAgent: req.get('user-agent') || 'unknown',
            status_code: 200
        });
    } catch (err) {
        console.error("Failed to fetch cost statistics:", err);
        res.status(500).json({ error: 'Failed to aggregate costs' });
    }
});

export default router;
