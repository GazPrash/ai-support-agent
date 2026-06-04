import crypto from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { ChatHistory, ConversationRecord, MessageRecord, MessageSender } from "./models";

/**
 * Encapsulates all database access for conversations and messages.
 */
export class ChatRepository {
  private readonly database: DatabaseSync;

  public constructor(database: DatabaseSync) {
    this.database = database;
  }

  /**
   * Creates a new conversation row and returns it.
   */
  public createConversation(sessionId?: string): ConversationRecord {
    const now = new Date().toISOString();
    const id = sessionId ?? crypto.randomUUID();

    this.database
      .prepare(
        `
          INSERT INTO conversations (id, created_at, updated_at)
          VALUES (?, ?, ?)
        `,
      )
      .run(id, now, now);

    return {
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Returns a conversation by id when it exists.
   */
  public getConversation(sessionId: string): ConversationRecord | null {
    const row = this.database
      .prepare(
        `
          SELECT id, created_at, updated_at
          FROM conversations
          WHERE id = ?
        `,
      )
      .get(sessionId) as
      | { id: string; created_at: string; updated_at: string }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Returns a conversation with recent messages in chronological order.
   */
  public getConversationHistory(sessionId: string, limit: number): ChatHistory | null {
    const conversation = this.getConversation(sessionId);

    if (!conversation) {
      return null;
    }

    const rows = this.database
      .prepare(
        `
          SELECT id, conversation_id, sender, text, created_at
          FROM messages
          WHERE conversation_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `,
      )
      .all(sessionId, limit) as Array<{
      id: string;
      conversation_id: string;
      sender: MessageSender;
      text: string;
      created_at: string;
    }>;

    const messages = rows
      .map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        sender: row.sender,
        text: row.text,
        createdAt: row.created_at,
      }))
      .reverse();

    return {
      conversation,
      messages,
    };
  }

  /**
   * Persists a message and bumps the parent conversation update time.
   */
  public createMessage(
    sessionId: string,
    sender: MessageSender,
    text: string,
  ): MessageRecord {
    const message: MessageRecord = {
      id: crypto.randomUUID(),
      conversationId: sessionId,
      sender,
      text,
      createdAt: new Date().toISOString(),
    };

    const insertMessage = this.database.prepare(
      `
        INSERT INTO messages (id, conversation_id, sender, text, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
    );

    const updateConversation = this.database.prepare(
      `
        UPDATE conversations
        SET updated_at = ?
        WHERE id = ?
      `,
    );

    this.database.exec("BEGIN");

    try {
      insertMessage.run(
        message.id,
        message.conversationId,
        message.sender,
        message.text,
        message.createdAt,
      );
      updateConversation.run(message.createdAt, sessionId);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }

    return message;
  }
}
