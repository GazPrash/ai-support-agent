import { useConversation } from "./chat/useConversation";
import { ChatHero } from "./components/ChatHero";
import { ChatPanel } from "./components/ChatPanel";

/**
 * Composes the landing panel and live chat panel for the support experience.
 */
export default function App() {
  const controller = useConversation();

  return (
    <div className="page-shell">
      <main className="chat-layout">
        <ChatHero />
        <ChatPanel
          input={controller.input}
          isInitializing={controller.isInitializing}
          isSending={controller.isSending}
          messages={controller.messages}
          promptOptions={controller.promptOptions}
          messagesContainerRef={controller.messagesContainerRef}
          textareaRef={controller.textareaRef}
          onInputChange={controller.setInput}
          onPromptSelect={(prompt) => {
            void controller.submitPrompt(prompt);
          }}
          onSubmit={() => {
            void controller.submitCurrentInput();
          }}
        />
      </main>
    </div>
  );
}
