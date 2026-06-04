import { ChatMessage, Conversation, type ChatMessageRecord } from "./models";
import { SessionStorage } from "./storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";
const OPENING_PROMPT =
  "Hi there. I'm your pshr support agent. Ask me about shipping, returns, billing, or anything else you'd like help with today.";

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

interface BackendChatResponse {
  reply: string;
  sessionId: string;
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

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/${activeConversationId}/messages`,
      );

      if (!response.ok) {
        this.sessionStorage.clearActiveConversationId();
        return this.createOpeningConversation();
      }

      const payload = (await response.json()) as BackendHistoryResponse;
      return Conversation.create({
        id: payload.sessionId,
        messages: payload.messages.map((message) => this.mapBackendMessage(message)),
      });
    } catch {
      return this.createOpeningConversation();
    }
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
          .filter((message) => !this.isOpeningOnlyAssistantMessage(conversation, message)),
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
