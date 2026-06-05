import type { AppConfig } from "./config";
import { ChatRepository } from "./chatRepository";
import type {
  ChatHistory,
  ChatResponse,
  MessageRecord,
  RecentConversationRecord,
} from "./models";
import { RecentConversationCache } from "./recentConversationCache";
import { ResponderService } from "./responderService";

/**
 * Orchestrates conversation loading, persistence, caching, and reply generation.
 */
export class ChatService {
  private readonly repository: ChatRepository;
  private readonly cache: RecentConversationCache;
  private readonly responderService: ResponderService;
  private readonly recentHistoryLimit: number;
  private readonly recentConversationLimit = 10;

  public constructor(
    repository: ChatRepository,
    cache: RecentConversationCache,
    responderService: ResponderService,
    config: AppConfig,
  ) {
    this.repository = repository;
    this.cache = cache;
    this.responderService = responderService;
    this.recentHistoryLimit = config.recentHistoryLimit;
  }

  /**
   * Loads recent history for a session or returns null when it does not exist.
   */
  public async getHistory(sessionId: string): Promise<ChatHistory | null> {
    const history = await this.repository.getConversationHistory(
      sessionId,
      this.recentHistoryLimit,
    );

    if (!history) {
      return null;
    }

    this.cache.set(sessionId, history.messages);
    return history;
  }

  /**
   * Returns the most recently updated saved conversations for the UI dropdown.
   */
  public async getRecentConversations(): Promise<RecentConversationRecord[]> {
    return this.repository.getRecentConversations(this.recentConversationLimit);
  }

  /**
   * Persists the incoming user message, generates the assistant reply, and saves both.
   */
  public async sendMessage(
    message: string,
    sessionId?: string,
  ): Promise<ChatResponse> {
    const existingConversation = sessionId
      ? await this.repository.getConversation(sessionId)
      : null;
    const conversation =
      existingConversation ?? (await this.repository.createConversation(sessionId));

    const cachedMessages = this.cache.get(conversation.id);

    let priorHistory: MessageRecord[] = [];
    if (cachedMessages) {
      priorHistory = cachedMessages;
    } else {
      const history = await this.repository.getConversationHistory(
        conversation.id,
        this.recentHistoryLimit,
      );

      if (history?.messages) {
        priorHistory = history.messages;
      }
    }

    const userMessage = await this.repository.createMessage(
      conversation.id,
      "user",
      message,
    );

    const historyForResponder = [...priorHistory, userMessage].slice(
      -this.recentHistoryLimit,
    );

    const reply = await this.responderService.respond(
      message,
      historyForResponder,
    );

    const aiMessage = await this.repository.createMessage(
      conversation.id,
      "ai",
      reply,
    );
    const nextHistory = [...historyForResponder, aiMessage].slice(
      -this.recentHistoryLimit,
    );

    this.cache.set(conversation.id, nextHistory);

    return {
      reply,
      sessionId: conversation.id,
    };
  }
}
