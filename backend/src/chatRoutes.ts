import { Router } from "express";
import { z } from "zod";
import { ChatService } from "./chatService.js";

const postMessageSchema = z.object({
  message: z.string().trim().min(1),
  sessionId: z.string().trim().min(1).optional(),
});

/**
 * Creates the chat API routes used by the frontend.
 */
export function createChatRoutes(chatService: ChatService) {
  const router = Router();

  router.post("/message", async (request, response, next) => {
    try {
      const payload = postMessageSchema.parse(request.body);
      const result = await chatService.sendMessage(payload.message, payload.sessionId);
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/recent", async (_request, response, next) => {
    try {
      const conversations = await chatService.getRecentConversations();
      response.json({ conversations });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:sessionId/messages", async (request, response, next) => {
    try {
      const history = await chatService.getHistory(request.params.sessionId);

      if (!history) {
        response.status(404).json({ error: "Conversation not found." });
        return;
      }

      response.json({
        sessionId: history.conversation.id,
        messages: history.messages,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
