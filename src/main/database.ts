import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'sessions.db');
const db = new Database(dbPath);

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT,
      last_login INTEGER
    );

    CREATE TABLE IF NOT EXISTS auth_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id TEXT,
      refresh_token TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      transcript TEXT,
      summary TEXT,
      key_points TEXT,
      action_items TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
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

// Simple auth functions
export function createUser(email: string, passwordHash: string): void {
  const stmt = db.prepare(`
    INSERT INTO users (id, email, display_name, last_login) 
    VALUES (?, ?, ?, ?)
  `);
  const userId = Date.now().toString(); // Simple unique ID
  stmt.run(userId, email, null, Date.now());
  
  // Save password hash
  const authStmt = db.prepare(`
    INSERT INTO auth_state (id, user_id, refresh_token) 
    VALUES (1, ?, ?)
  `);
  authStmt.run(userId, passwordHash);
}

export function loginUser(email: string, passwordHash: string): boolean {
  const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const user = stmt.get(email) as { id: string } | undefined;
  
  if (!user) return false;
  
  // Update last login and save session
  const updateStmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
  updateStmt.run(Date.now(), user.id);
  
  const authStmt = db.prepare(`
    INSERT OR REPLACE INTO auth_state (id, user_id, refresh_token) 
    VALUES (1, ?, ?)
  `);
  authStmt.run(user.id, passwordHash);
  
  return true;
}

export function getAuthState(): { user_id: string; email: string } | null {
  const stmt = db.prepare(`
    SELECT u.id as user_id, u.email 
    FROM auth_state a 
    JOIN users u ON a.user_id = u.id 
    WHERE a.id = 1
  `);
  return stmt.get() as { user_id: string; email: string } | null;
}

export function clearAuthState(): void {
  db.prepare('DELETE FROM auth_state WHERE id = 1').run();
}

