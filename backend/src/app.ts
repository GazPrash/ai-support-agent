import cors from "cors";
import express from "express";
import { ChatRepository } from "./chatRepository";
import { ChatService } from "./chatService";
import type { AppConfig } from "./config";
import { createDatabase } from "./db";
import { RecentConversationCache } from "./recentConversationCache";
import { ResponderService } from "./responderService";
import { createChatRoutes } from "./chatRoutes";

/**
 * Builds the Express application with routes and shared services.
 */
export function createApp(config: AppConfig) {
  const app = express();
  const database = createDatabase(config);
  const repository = new ChatRepository(database);
  const cache = new RecentConversationCache(config.cacheTtlMs);
  const responderService = new ResponderService(config);
  const chatService = new ChatService(repository, cache, responderService, config);

  app.use(
    cors({
      origin: config.frontendOrigin,
    }),
  );
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.use("/chat", createChatRoutes(chatService));

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    let message = "Unexpected error";

    if (error instanceof Error) {
      message = error.message;
    }

    response.status(400).json({ error: message });
  });

  return app;
}
