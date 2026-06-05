import { useEffect, useRef, useState, type RefObject } from "react";
import type { ChatMessage, Conversation } from "./models";
import type { RecentConversationSummary } from "./service";
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
  isLoadingConversation: boolean;
  isSending: boolean;
  recentConversations: RecentConversationSummary[];
  messages: ChatMessage[];
  promptOptions: PromptOption[];
  messagesContainerRef: RefObject<HTMLDivElement>;
  textareaRef: RefObject<HTMLTextAreaElement>;
  selectedConversationId: string;
  setInput: (nextValue: string) => void;
  selectConversation: (conversationId: string) => Promise<void>;
  startNewConversation: () => void;
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
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recentConversations, setRecentConversations] = useState<RecentConversationSummary[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applyNewConversation(): void {
    setInput("");
    setConversation(service.createNewConversation());
    textareaRef.current?.focus();
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrapConversation(): Promise<void> {
      const [nextConversation, nextRecentConversations] = await Promise.all([
        service.initializeConversation(),
        service.loadRecentConversations(),
      ]);

      if (!isMounted) {
        return;
      }

      setConversation(nextConversation);
      setRecentConversations(nextRecentConversations);
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
      setRecentConversations(await service.loadRecentConversations());
      textareaRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  }

  async function selectConversation(conversationId: string): Promise<void> {
    if (isInitializing || isSending || isLoadingConversation) {
      return;
    }

    if (conversationId === "__new__") {
      applyNewConversation();
      return;
    }

    setIsLoadingConversation(true);
    setInput("");

    try {
      const nextConversation = await service.loadConversation(conversationId);

      if (!nextConversation) {
        applyNewConversation();
        return;
      }

      service.setActiveConversationId(conversationId);
      setConversation(nextConversation);
      setRecentConversations(await service.loadRecentConversations());
    } finally {
      setIsLoadingConversation(false);
      textareaRef.current?.focus();
    }
  }

  function startNewConversation(): void {
    if (isInitializing || isSending || isLoadingConversation) {
      return;
    }

    applyNewConversation();
  }

  const selectedConversationId =
    conversation && !conversation.id.startsWith("local-")
      ? conversation.id
      : "__new__";

  return {
    input,
    isInitializing,
    isLoadingConversation,
    isSending,
    recentConversations,
    messages: conversation?.getMessages() ?? [],
    promptOptions: DEFAULT_PROMPTS,
    messagesContainerRef,
    textareaRef,
    selectedConversationId,
    setInput,
    selectConversation,
    startNewConversation,
    submitCurrentInput: async () => {
      await sendMessage(input);
    },
    submitPrompt: async (prompt: string) => {
      await sendMessage(prompt);
    },
  };
}
