import type { MessageRecord } from "./models";

interface CacheEntry {
  expiresAt: number;
  messages: MessageRecord[];
}

/**
 * Stores recent conversation windows in memory to avoid repeated DB reads.
 */
export class RecentConversationCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  public constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  /**
   * Returns cached recent messages for a session when the entry is still fresh.
   */
  public get(sessionId: string): MessageRecord[] | null {
    const entry = this.entries.get(sessionId);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.entries.delete(sessionId);
      return null;
    }

    return entry.messages;
  }

  /**
   * Stores the latest recent message window for a session.
   */
  public set(sessionId: string, messages: MessageRecord[]): void {
    this.entries.set(sessionId, {
      expiresAt: Date.now() + this.ttlMs,
      messages,
    });
  }
}
