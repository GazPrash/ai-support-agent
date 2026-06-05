import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const databasePath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH ?? "./data/pshr-support-agent.sqlite",
);
const migrationPath = path.resolve(
  process.cwd(),
  "prisma/migrations/20260605120000_init/migration.sql",
);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");

const conversationTable = database
  .prepare(
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = ?
    `,
  )
  .get("conversations");

if (!conversationTable) {
  const migrationSql = fs.readFileSync(migrationPath, "utf8");
  database.exec(migrationSql);
}

database.close();
