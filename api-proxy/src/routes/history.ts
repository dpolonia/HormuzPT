import { Router, Request, Response } from 'express';
import db from '../services/db.js';

const router = Router();

type HistoryEvent = {
    id: number;
    timestamp: string;
    user: string;
    action: string;
    details: string;
};

// GET /api/history — Retrieve historical session events
router.get('/history', (req: Request, res: Response) => {
    try {
        const stmt = db.prepare('SELECT * FROM history_events ORDER BY id DESC LIMIT 100');
        const events = stmt.all();
        res.json({ events });
    } catch (err) {
        console.error("Failed to fetch history:", err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// POST /api/history — Record a new event
router.post('/history', (req: Request, res: Response) => {
    try {
        const { user, action, details } = req.body;
        
        if (!user || !action) {
            return res.status(400).json({ error: 'Missing user or action' });
        }

        const stmt = db.prepare('INSERT INTO history_events (timestamp, user, action, details) VALUES (?, ?, ?, ?)');
        const timestamp = new Date().toISOString();
        const info = stmt.run(timestamp, user, action, details ? JSON.stringify(details) : null);
        
        res.status(201).json({ success: true, id: info.lastInsertRowid });
    } catch (err) {
        console.error("Failed to register history event:", err);
        res.status(500).json({ error: 'Failed to record history' });
    }
});

export default router;
