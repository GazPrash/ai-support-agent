export type MessageSender = "user" | "ai";

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
}

export interface ConversationMetadata {
  channel?: string;
  locale?: string;
  customerId?: string;
}

export interface ConversationRecord {
  id: string;
  createdAt: string;
  metadata?: ConversationMetadata;
  messages: ChatMessageRecord[];
}

/**
 * Represents a single user or AI message in a conversation.
 */
export class ChatMessage {
  public readonly id: string;
  public readonly conversationId: string;
  public readonly sender: MessageSender;
  public readonly text: string;
  public readonly timestamp: string;

  public constructor(record: ChatMessageRecord) {
    this.id = record.id;
    this.conversationId = record.conversationId;
    this.sender = record.sender;
    this.text = record.text;
    this.timestamp = record.timestamp;
  }

  /**
   * Creates a new message with a timestamp when one is not provided.
   */
  public static create(params: {
    id: string;
    conversationId: string;
    sender: MessageSender;
    text: string;
    timestamp?: string;
  }): ChatMessage {
    return new ChatMessage({
      id: params.id,
      conversationId: params.conversationId,
      sender: params.sender,
      text: params.text,
      timestamp: params.timestamp ?? new Date().toISOString(),
    });
  }

  /**
   * Converts the message into a plain object for storage or transport.
   */
  public toRecord(): ChatMessageRecord {
    return {
      id: this.id,
      conversationId: this.conversationId,
      sender: this.sender,
      text: this.text,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Represents a conversation and provides immutable helpers for message updates.
 */
export class Conversation {
  public readonly id: string;
  public readonly createdAt: string;
  public readonly metadata?: ConversationMetadata;
  private readonly messages: ChatMessage[];

  public constructor(record: ConversationRecord) {
    this.id = record.id;
    this.createdAt = record.createdAt;
    this.metadata = record.metadata;
    this.messages = record.messages.map((message) => new ChatMessage(message));
  }

  /**
   * Creates a new conversation with optional metadata and starter messages.
   */
  public static create(params: {
    id: string;
    createdAt?: string;
    metadata?: ConversationMetadata;
    messages?: ChatMessage[];
  }): Conversation {
    return new Conversation({
      id: params.id,
      createdAt: params.createdAt ?? new Date().toISOString(),
      metadata: params.metadata,
      messages: params.messages?.map((message) => message.toRecord()) ?? [],
    });
  }

  /**
   * Returns a new conversation instance with one extra message appended.
   */
  public appendMessage(message: ChatMessage): Conversation {
    return new Conversation({
      id: this.id,
      createdAt: this.createdAt,
      metadata: this.metadata,
      messages: [...this.messages, message].map((item) => item.toRecord()),
    });
  }

  /**
   * Returns the current message history in display order.
   */
  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Converts the conversation into a plain object for storage or transport.
   */
  public toRecord(): ConversationRecord {
    return {
      id: this.id,
      createdAt: this.createdAt,
      metadata: this.metadata,
      messages: this.messages.map((message) => message.toRecord()),
    };
  }
}
