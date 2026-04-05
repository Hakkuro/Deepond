import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../data/kanban.db');
const db = new sqlite3.Database(dbPath);

export const initDb = () => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT,
        avatar_seed TEXT,
        api_key TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Boards table
      db.run(`CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT,
        owner_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`);

      // Board Collaborators
      db.run(`CREATE TABLE IF NOT EXISTS collaborators (
        board_id TEXT,
        user_id TEXT,
        permission TEXT, -- 'owner', 'editor', 'viewer'
        PRIMARY KEY (board_id, user_id),
        FOREIGN KEY (board_id) REFERENCES boards(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // Columns table
      db.run(`CREATE TABLE IF NOT EXISTS columns (
        id TEXT PRIMARY KEY,
        board_id TEXT,
        title TEXT,
        position INTEGER,
        FOREIGN KEY (board_id) REFERENCES boards(id)
      )`);

      // Tasks table
      db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        column_id TEXT,
        content TEXT,
        description TEXT,
        priority TEXT,
        due_date TEXT,
        tags TEXT, -- JSON string
        position INTEGER,
        FOREIGN KEY (column_id) REFERENCES columns(id)
      )`);

      // Notifications table
      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        type TEXT,
        title TEXT,
        content TEXT,
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // Migration: 为已有数据库添加 api_key 列
      db.run(`ALTER TABLE users ADD COLUMN api_key TEXT`, (err) => {
        // 忽略 "duplicate column" 错误（列已存在时）
        if (err && !err.message.includes('duplicate column')) {
          return reject(err);
        }
        // 创建唯一索引（若不存在）
        db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key)`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  });
};

export default db;
