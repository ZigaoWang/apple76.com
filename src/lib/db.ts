import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openDb() {
  return open({
    filename: './apple76.sqlite',
    driver: sqlite3.Database,
  });
}

export async function initDb() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      year INTEGER,
      collection TEXT,
      original_link TEXT,
      description TEXT,
      tags TEXT,
      oss_key TEXT UNIQUE,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
}

// Allow running this file directly to initialize the DB
if (import.meta.url === `file://${process.argv[1]}`) {
  initDb().then(() => {
    console.log('Database initialized.');
    process.exit(0);
  });
} 