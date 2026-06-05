import type { FormEvent, KeyboardEvent, RefObject } from "react";
import type { ChatMessage } from "../chat/models";
import type { PromptOption } from "../chat/useConversation";
import type { RecentConversationSummary } from "../chat/service";
import { MessageItem } from "./MessageItem";

const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL ?? "support@pshr.example";

interface ChatPanelProps {
  messages: ChatMessage[];
  input: string;
  isInitializing: boolean;
  isLoadingConversation: boolean;
  isSending: boolean;
  promptOptions: PromptOption[];
  recentConversations: RecentConversationSummary[];
  selectedConversationId: string;
  onInputChange: (nextValue: string) => void;
  onConversationSelect: (conversationId: string) => void;
  onStartNewConversation: () => void;
  onSubmit: () => void;
  onPromptSelect: (prompt: string) => void;
  messagesContainerRef: RefObject<HTMLDivElement>;
  textareaRef: RefObject<HTMLTextAreaElement>;
}

/**
 * Renders the interactive chat panel and delegates actions back to the controller.
 */
export function ChatPanel({
  messages,
  input,
  isInitializing,
  isLoadingConversation,
  isSending,
  promptOptions,
  recentConversations,
  selectedConversationId,
  onInputChange,
  onConversationSelect,
  onStartNewConversation,
  onSubmit,
  onPromptSelect,
  messagesContainerRef,
  textareaRef,
}: ChatPanelProps) {
  function handleFormSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  function getStatusLabel(): string {
    if (isInitializing) {
      return "Loading";
    }

    if (isLoadingConversation) {
      return "Switching";
    }

    if (isSending) {
      return "Responding";
    }

    return "Online";
  }

  function getSubmitLabel(): string {
    if (isSending) {
      return "Sending...";
    }

    return "Send";
  }

  function formatConversationLabel(
    conversation: RecentConversationSummary,
  ): string {
    const timestamp = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(conversation.updatedAt));
    const preview = conversation.lastMessageText.trim().replace(/\s+/g, " ");
    const clippedPreview =
      preview.length > 42 ? `${preview.slice(0, 42).trimEnd()}…` : preview;

    return `${timestamp} · ${clippedPreview}`;
  }

  return (
    <section className="chat-panel" aria-label="Support chat">
      <header className="chat-header">
        <div>
          <p className="chat-kicker">pshr Support Agent</p>
          <h2>Customer Support</h2>
        </div>
        <div className="status-pill" aria-live="polite">
          <span className="status-dot"></span>
          <span>{getStatusLabel()}</span>
        </div>
      </header>

      <div className="chat-body">
        <div className="conversation-switcher">
          <label
            className="conversation-switcher__label"
            htmlFor="conversationSwitcher"
          >
            Conversation history
          </label>
          <select
            id="conversationSwitcher"
            className="conversation-switcher__select"
            value={selectedConversationId}
            disabled={isInitializing || isLoadingConversation || isSending}
            onChange={(event) => {
              const nextConversationId = event.target.value;

              if (nextConversationId === "__new__") {
                onStartNewConversation();
                return;
              }

              onConversationSelect(nextConversationId);
            }}
          >
            <option value="__new__">New conversation</option>
            {recentConversations.map((conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {formatConversationLabel(conversation)}
              </option>
            ))}
          </select>
        </div>

        <div className="quick-actions" aria-label="Suggested prompts">
          {promptOptions.map((option) => (
            <button
              key={option.prompt}
              className="prompt-chip"
              type="button"
              disabled={isInitializing || isSending}
              onClick={() => onPromptSelect(option.prompt)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div
          className="messages"
          ref={messagesContainerRef}
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </div>

        {isSending && (
          <div className="typing-row" aria-live="polite">
            <div className="message-avatar" aria-hidden="true">
              P
            </div>
            <div className="typing-bubble" aria-label="Agent is typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <form className="composer" onSubmit={handleFormSubmit}>
        <label className="sr-only" htmlFor="messageInput">
          Type your message
        </label>
        <div className="composer-main">
          <textarea
            id="messageInput"
            ref={textareaRef}
            rows={1}
            maxLength={500}
            placeholder="Ask a question about orders, shipping, returns..."
            value={input}
            disabled={isInitializing || isSending}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="send-button"
            type="submit"
            disabled={isInitializing || isSending || !input.trim()}
          >
            <span>{getSubmitLabel()}</span>
          </button>
        </div>
        <div className="composer-footer">
          <button
            type="button"
            className="new-conversation-button"
            disabled={isInitializing || isLoadingConversation || isSending}
            onClick={onStartNewConversation}
          >
            New conversation
          </button>
          <a className="email-support-button" href={`mailto:${SUPPORT_EMAIL}`}>
            Email Us
          </a>
        </div>
      </form>
    </section>
  );
}
