import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'slides.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

/**
 * 初始化数据库表结构
 */
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      theme TEXT NOT NULL,
      era TEXT NOT NULL,
      storage_location TEXT NOT NULL,
      category_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER NOT NULL,
      sequence INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      UNIQUE (folder_id, sequence)
    );
  `);

  const columns = db
    .prepare("PRAGMA table_info(folders)")
    .all()
    .map((c) => c.name);
  if (!columns.includes("category_id")) {
    db.exec(`
      ALTER TABLE folders ADD COLUMN category_id INTEGER
      REFERENCES categories(id) ON DELETE SET NULL
    `);
  }
}

/**
 * 获取片夹张数
 * @param {number} folderId
 * @returns {number}
 */
export function getSlideCount(folderId) {
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM slides WHERE folder_id = ?')
    .get(folderId);
  return row.count;
}

export default db;
