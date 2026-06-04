import type { ChatMessage } from "../chat/models";

interface MessageItemProps {
  message: ChatMessage;
}

/**
 * Renders a single message bubble with styling based on the sender.
 */
export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.sender === "user";
  let messageClassName = "message agent";
  let avatarLabel = "P";
  let authorLabel = "pshr";

  if (isUser) {
    messageClassName = "message user";
    avatarLabel = "Y";
    authorLabel = "You";
  }

  return (
    <article className={messageClassName}>
      <div className="message-avatar" aria-hidden="true">
        {avatarLabel}
      </div>
      <div className="message-bubble">
        <p className="message-author">{authorLabel}</p>
        <p>{message.text}</p>
      </div>
    </article>
  );
}
