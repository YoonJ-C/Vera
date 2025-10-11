import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'sessions.db');
const db = new Database(dbPath);

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      transcript TEXT,
      summary TEXT,
      key_points TEXT,
      action_items TEXT
    );

    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      text TEXT NOT NULL,
      sentiment TEXT,
      advice TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time);
  `);
  console.log('✓ Database initialized');
}

export function createSession(): number {
  const stmt = db.prepare('INSERT INTO sessions (start_time) VALUES (?)');
  const result = stmt.run(Date.now());
  return result.lastInsertRowid as number;
}

export function addInsight(
  sessionId: number,
  text: string,
  sentiment: string,
  advice: string
): void {
  const stmt = db.prepare(
    'INSERT INTO insights (session_id, timestamp, text, sentiment, advice) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(sessionId, Date.now(), text, sentiment, advice);
}

export function endSession(
  sessionId: number,
  transcript: string,
  summary: { summary: string; keyPoints: string[]; actionItems: string[] }
): void {
  const stmt = db.prepare(`
    UPDATE sessions 
    SET end_time = ?, transcript = ?, summary = ?, key_points = ?, action_items = ?
    WHERE id = ?
  `);
  stmt.run(
    Date.now(),
    transcript,
    summary.summary,
    JSON.stringify(summary.keyPoints),
    JSON.stringify(summary.actionItems),
    sessionId
  );
}

interface Session {
  id: number;
  start_time: number;
  end_time: number | null;
  transcript: string | null;
  summary: string | null;
  key_points: string | null;
  action_items: string | null;
}

export function getSessions(limit = 50): Session[] {
  const stmt = db.prepare('SELECT * FROM sessions ORDER BY start_time DESC LIMIT ?');
  return stmt.all(limit) as Session[];
}

