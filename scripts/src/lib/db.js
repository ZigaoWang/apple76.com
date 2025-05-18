"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openDb = openDb;
exports.closeDb = closeDb;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
let db = null;
async function openDb() {
    if (db)
        return db;
    const dbPath = path_1.default.join(process.cwd(), 'apple76.db');
    db = await (0, sqlite_1.open)({
        filename: dbPath,
        driver: sqlite3_1.default.Database
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
      thumbnail_key TEXT,
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
async function closeDb() {
    if (db) {
        await db.close();
        db = null;
    }
}
