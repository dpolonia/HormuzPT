import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure db directory exists
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite Database
const db = new Database(path.join(dbDir, 'history.sqlite'));

// Create history table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS history_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT
  )
`);

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
