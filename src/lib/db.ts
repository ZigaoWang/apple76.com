import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function openDb() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'apple76.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create items table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      year INTEGER,
      collection TEXT NOT NULL,
      original_link TEXT,
      description TEXT,
      tags TEXT,
      oss_key TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      source TEXT,
      author TEXT,
      file_size INTEGER,
      notes TEXT,
      is_year_unknown INTEGER DEFAULT 0
    )
  `);

  return db;
}

export async function closeDb() {
  if (db) {
    await db.close();
    db = null;
  }
} 