import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import type { AppConfig } from "./config.js";

/**
 * Opens the Prisma client against the local SQLite database file.
 */
export function createDatabase(config: AppConfig): PrismaClient {
  const absolutePath = path.resolve(config.databasePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  const adapter = new PrismaBetterSqlite3({ url: `file:${absolutePath}` });
  return new PrismaClient({ adapter });
}

export type PrismaDatabase = PrismaClient;
