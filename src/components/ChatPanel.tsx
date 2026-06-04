import type { FormEvent, KeyboardEvent, RefObject } from "react";
import type { ChatMessage } from "../chat/models";
import type { PromptOption } from "../chat/useConversation";
import { MessageItem } from "./MessageItem";

interface ChatPanelProps {
  messages: ChatMessage[];
  input: string;
  isInitializing: boolean;
  isSending: boolean;
  promptOptions: PromptOption[];
  onInputChange: (nextValue: string) => void;
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
  isSending,
  promptOptions,
  onInputChange,
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

        <div className="messages" ref={messagesContainerRef} aria-live="polite" aria-label="Conversation">
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
        <button type="submit" disabled={isInitializing || isSending || !input.trim()}>
          <span>{getSubmitLabel()}</span>
        </button>
      </form>
    </section>
  );
}
