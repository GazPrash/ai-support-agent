import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AppConfig } from "./config";

/**
 * Opens the SQLite database and ensures the required tables exist.
 */
export function createDatabase(config: AppConfig) {
  const absolutePath = path.resolve(config.databasePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  const database = new DatabaseSync(absolutePath);
  database.exec("PRAGMA journal_mode = WAL;");

  database.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
      ON messages(conversation_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_conversations_updated
      ON conversations(updated_at);
  `);

  return database;
}

export type SqliteDatabase = ReturnType<typeof createDatabase>;
