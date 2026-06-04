import { useEffect, useRef, useState, type RefObject } from "react";
import type { ChatMessage, Conversation } from "./models";
import { ConversationService } from "./service";
import { SessionStorage } from "./storage";

/**
 * Describes a preset prompt shown above the composer for quick testing.
 */
export interface PromptOption {
  label: string;
  prompt: string;
}

/**
 * Exposes the chat state and actions consumed by the UI layer.
 */
export interface ConversationController {
  input: string;
  isInitializing: boolean;
  isSending: boolean;
  messages: ChatMessage[];
  promptOptions: PromptOption[];
  messagesContainerRef: RefObject<HTMLDivElement>;
  textareaRef: RefObject<HTMLTextAreaElement>;
  setInput: (nextValue: string) => void;
  submitCurrentInput: () => Promise<void>;
  submitPrompt: (prompt: string) => Promise<void>;
}

const DEFAULT_PROMPTS: PromptOption[] = [
  { label: "Return policy", prompt: "What is your return policy?" },
  { label: "Shipping to USA", prompt: "Do you ship to the USA?" },
  { label: "Delivery times", prompt: "How long does delivery take?" },
];

/**
 * Connects React state to the conversation service used by the chat UI.
 */
export function useConversation(): ConversationController {
  const serviceRef = useRef<ConversationService | null>(null);

  if (!serviceRef.current) {
    serviceRef.current = new ConversationService(new SessionStorage());
  }

  const service = serviceRef.current;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapConversation(): Promise<void> {
      const nextConversation = await service.initializeConversation();

      if (!isMounted) {
        return;
      }

      setConversation(nextConversation);
      setIsInitializing(false);
    }

    void bootstrapConversation();

    return () => {
      isMounted = false;
    };
  }, [service]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [conversation, isSending]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [isInitializing]);

  async function sendMessage(rawMessage: string): Promise<void> {
    const message = rawMessage.trim();

    if (!conversation || !message || isInitializing || isSending) {
      return;
    }

    setIsSending(true);
    setInput("");

    try {
      const nextConversation = await service.sendMessage(conversation, message);
      setConversation(nextConversation);
      textareaRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  }

  return {
    input,
    isInitializing,
    isSending,
    messages: conversation?.getMessages() ?? [],
    promptOptions: DEFAULT_PROMPTS,
    messagesContainerRef,
    textareaRef,
    setInput,
    submitCurrentInput: async () => {
      await sendMessage(input);
    },
    submitPrompt: async (prompt: string) => {
      await sendMessage(prompt);
    },
  };
}
