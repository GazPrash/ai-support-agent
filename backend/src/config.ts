import dotenv from "dotenv";

dotenv.config();

export type ResponderMode = "passive" | "llm";

/**
 * Shape of the application configuration object.
 */
export interface AppConfig {
  port: number;
  frontendOrigin: string;
  databasePath: string;
  responderMode: ResponderMode;
  fallbackEmail: string;
  openAiApiKey: string;
  openAiModel: string;
  recentHistoryLimit: number;
  cacheTtlMs: number;
}

/**
 * Reads environment configuration for the backend server.
 */
export function getConfig(): AppConfig {
  const responderMode = (process.env.RESPONDER_MODE ?? "passive") as ResponderMode;

  return {
    port: Number(process.env.PORT ?? 3001),
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    databasePath: process.env.DATABASE_PATH ?? "./data/pshr-support-agent.sqlite",
    responderMode,
    fallbackEmail: process.env.SUPPORT_EMAIL ?? "support@pshr.example",
    openAiApiKey: process.env.OPENAI_API_KEY ?? "",
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    recentHistoryLimit: Number(process.env.RECENT_HISTORY_LIMIT ?? 20),
    cacheTtlMs: Number(process.env.CACHE_TTL_MS ?? 5 * 60 * 1000),
  };
}
