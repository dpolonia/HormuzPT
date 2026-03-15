/**
 * Shared SQLite connection for the api-proxy.
 *
 * All routes that need history_events access should import `db` from here
 * instead of instantiating their own better-sqlite3 connection.
 *
 * The database file lives at <cwd>/data/history.sqlite.
 */

import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db: DatabaseType = new Database(path.join(dbDir, 'history.sqlite'));

// Ensure schema exists (idempotent)
db.exec(`
  CREATE TABLE IF NOT EXISTS history_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT
  )
`);

export default db;
