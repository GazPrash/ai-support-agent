import crypto from "node:crypto";
import type { PrismaDatabase } from "./db";
import type {
  ChatHistory,
  ConversationRecord,
  MessageRecord,
  MessageSender,
  RecentConversationRecord,
} from "./models";

/**
 * Encapsulates all database access for conversations and messages.
 */
export class ChatRepository {
  private readonly database: PrismaDatabase;

  public constructor(database: PrismaDatabase) {
    this.database = database;
  }

  /**
   * Creates a new conversation row and returns it.
   */
  public async createConversation(sessionId?: string): Promise<ConversationRecord> {
    const now = new Date();
    const id = sessionId ?? crypto.randomUUID();

    const conversation = await this.database.conversation.create({
      data: {
        id,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.mapConversation(conversation);
  }

  /**
   * Returns a conversation by id when it exists.
   */
  public async getConversation(sessionId: string): Promise<ConversationRecord | null> {
    const conversation = await this.database.conversation.findUnique({
      where: { id: sessionId },
    });

    if (!conversation) {
      return null;
    }

    return this.mapConversation(conversation);
  }

  /**
   * Returns the most recently updated conversations for the history dropdown.
   */
  public async getRecentConversations(limit: number): Promise<RecentConversationRecord[]> {
    const conversations = await this.database.conversation.findMany({
      where: {
        messages: {
          some: {},
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return conversations
      .filter((conversation) => conversation.messages[0])
      .map((conversation) => ({
        id: conversation.id,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        lastMessageText: conversation.messages[0].text,
        lastMessageSender: conversation.messages[0].sender as MessageSender,
        messageCount: conversation._count.messages,
      }));
  }

  /**
   * Returns a conversation with recent messages in chronological order.
   */
  public async getConversationHistory(
    sessionId: string,
    limit: number,
  ): Promise<ChatHistory | null> {
    const conversation = await this.getConversation(sessionId);

    if (!conversation) {
      return null;
    }

    const messages = await this.database.message.findMany({
      where: {
        conversationId: sessionId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return {
      conversation,
      messages: messages
        .map((message) => this.mapMessage(message))
        .reverse(),
    };
  }

  /**
   * Persists a message and bumps the parent conversation update time.
   */
  public async createMessage(
    sessionId: string,
    sender: MessageSender,
    text: string,
  ): Promise<MessageRecord> {
    const now = new Date();
    const messageId = crypto.randomUUID();

    const result = await this.database.$transaction(async (transaction) => {
      await transaction.message.create({
        data: {
          id: messageId,
          conversationId: sessionId,
          sender,
          text,
          createdAt: now,
        },
      });

      await transaction.conversation.update({
        where: {
          id: sessionId,
        },
        data: {
          updatedAt: now,
        },
      });

      return transaction.message.findUniqueOrThrow({
        where: {
          id: messageId,
        },
      });
    });

    return this.mapMessage(result);
  }

  private mapConversation(conversation: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  }): ConversationRecord {
    return {
      id: conversation.id,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  private mapMessage(message: {
    id: string;
    conversationId: string;
    sender: string;
    text: string;
    createdAt: Date;
  }): MessageRecord {
    return {
      id: message.id,
      conversationId: message.conversationId,
      sender: message.sender as MessageSender,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
