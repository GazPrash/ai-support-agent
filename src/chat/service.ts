import { ChatMessage, Conversation, type ChatMessageRecord } from "./models";
import { SessionStorage } from "./storage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";
const OPENING_PROMPT =
  "Hi there. I'm pShr, your AI support agent. Ask me about shipping, returns, billing, or anything else you'd like help with today.";

interface BackendMessageRecord {
  id: string;
  conversationId: string;
  sender: "user" | "ai";
  text: string;
  createdAt: string;
}

interface BackendHistoryResponse {
  sessionId: string;
  messages: BackendMessageRecord[];
}

interface BackendRecentConversationRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessageText: string;
  lastMessageSender: "user" | "ai";
  messageCount: number;
}

interface BackendRecentConversationsResponse {
  conversations: BackendRecentConversationRecord[];
}

interface BackendChatResponse {
  reply: string;
  sessionId: string;
}

export interface RecentConversationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessageText: string;
  lastMessageSender: "user" | "ai";
  messageCount: number;
}

/**
 * Coordinates frontend chat state with the backend conversation API.
 */
export class ConversationService {
  private readonly sessionStorage: SessionStorage;

  public constructor(sessionStorage: SessionStorage) {
    this.sessionStorage = sessionStorage;
  }

  /**
   * Restores backend-backed history when a session exists, otherwise returns the opening state.
   */
  public async initializeConversation(): Promise<Conversation> {
    const activeConversationId = this.sessionStorage.getActiveConversationId();

    if (!activeConversationId) {
      return this.createOpeningConversation();
    }

    const loadedConversation =
      await this.loadConversation(activeConversationId);

    if (loadedConversation) {
      return loadedConversation;
    }

    this.sessionStorage.clearActiveConversationId();
    return this.createOpeningConversation();
  }

  /**
   * Loads the latest saved conversations for the selection dropdown.
   */
  public async loadRecentConversations(): Promise<RecentConversationSummary[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/recent`);

      if (!response.ok) {
        return [];
      }

      const payload =
        (await response.json()) as BackendRecentConversationsResponse;
      return payload.conversations.map((conversation) => ({
        id: conversation.id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessageText: conversation.lastMessageText,
        lastMessageSender: conversation.lastMessageSender,
        messageCount: conversation.messageCount,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Loads a single saved conversation by id.
   */
  public async loadConversation(
    sessionId: string,
  ): Promise<Conversation | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/${sessionId}/messages`,
      );

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as BackendHistoryResponse;
      return Conversation.create({
        id: payload.sessionId,
        messages: payload.messages.map((message) =>
          this.mapBackendMessage(message),
        ),
      });
    } catch {
      return null;
    }
  }

  /**
   * Clears the remembered session and returns the opening conversation state.
   */
  public createNewConversation(): Conversation {
    this.sessionStorage.clearActiveConversationId();
    return this.createOpeningConversation();
  }

  /**
   * Remembers a saved conversation as the active session.
   */
  public setActiveConversationId(conversationId: string): void {
    this.sessionStorage.setActiveConversationId(conversationId);
  }

  /**
   * Sends the message to the backend, then updates local UI state with the saved exchange.
   */
  public async sendMessage(
    conversation: Conversation,
    text: string,
  ): Promise<Conversation> {
    let sessionId: string | undefined = conversation.id;

    if (this.isEphemeralConversation(conversation.id)) {
      sessionId = undefined;
    }

    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error("Unable to reach the support backend.");
    }

    const payload = (await response.json()) as BackendChatResponse;
    this.sessionStorage.setActiveConversationId(payload.sessionId);

    const userMessage = ChatMessage.create({
      id: crypto.randomUUID(),
      conversationId: payload.sessionId,
      sender: "user",
      text,
    });

    const aiMessage = ChatMessage.create({
      id: crypto.randomUUID(),
      conversationId: payload.sessionId,
      sender: "ai",
      text: payload.reply,
    });

    return Conversation.create({
      id: payload.sessionId,
      createdAt: conversation.createdAt,
      messages: [
        ...conversation
          .getMessages()
          .filter(
            (message) =>
              !this.isOpeningOnlyAssistantMessage(conversation, message),
          ),
        userMessage,
        aiMessage,
      ],
    });
  }

  private createOpeningConversation(): Conversation {
    return Conversation.create({
      id: `local-${crypto.randomUUID()}`,
      messages: [
        ChatMessage.create({
          id: crypto.randomUUID(),
          conversationId: `opening-${crypto.randomUUID()}`,
          sender: "ai",
          text: OPENING_PROMPT,
        }),
      ],
    });
  }

  private mapBackendMessage(message: BackendMessageRecord): ChatMessage {
    const record: ChatMessageRecord = {
      id: message.id,
      conversationId: message.conversationId,
      sender: message.sender,
      text: message.text,
      timestamp: message.createdAt,
    };

    return new ChatMessage(record);
  }

  private isEphemeralConversation(conversationId: string): boolean {
    return conversationId.startsWith("local-");
  }

  private isOpeningOnlyAssistantMessage(
    conversation: Conversation,
    message: ChatMessage,
  ): boolean {
    return (
      this.isEphemeralConversation(conversation.id) &&
      message.sender === "ai" &&
      message.text === OPENING_PROMPT
    );
  }
}
