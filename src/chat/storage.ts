const ACTIVE_CONVERSATION_KEY = "pshr-support-chat:conversation-id";

/**
 * Stores only the active backend session id used to reload chat history.
 */
export class SessionStorage {
  /**
   * Returns the active conversation id when the browser has one saved.
   */
  public getActiveConversationId(): string | null {
    return window.localStorage.getItem(ACTIVE_CONVERSATION_KEY);
  }

  /**
   * Persists the active conversation id for reloads.
   */
  public setActiveConversationId(conversationId: string): void {
    window.localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversationId);
  }

  /**
   * Clears the remembered conversation id.
   */
  public clearActiveConversationId(): void {
    window.localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  }
}
