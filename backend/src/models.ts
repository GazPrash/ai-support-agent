export type MessageSender = "user" | "ai";

export interface ConversationRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecentConversationRecord extends ConversationRecord {
  lastMessageText: string;
  lastMessageSender: MessageSender;
  messageCount: number;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  sender: MessageSender;
  text: string;
  createdAt: string;
}

export interface ChatHistory {
  conversation: ConversationRecord;
  messages: MessageRecord[];
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
}
