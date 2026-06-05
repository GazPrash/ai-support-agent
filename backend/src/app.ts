import cors from "cors";
import express from "express";
import { ChatRepository } from "./chatRepository.js";
import { ChatService } from "./chatService.js";
import type { AppConfig } from "./config.js";
import { createDatabase } from "./db.js";
import { RecentConversationCache } from "./recentConversationCache.js";
import { ResponderService } from "./responderService.js";
import { createChatRoutes } from "./chatRoutes.js";

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
