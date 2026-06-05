import type { AppConfig } from "./config.js";
import type { MessageRecord } from "./models.js";
import { LlmResponder } from "./llmResponder.js";
import { PassiveResponder } from "./passiveResponder.js";

/**
 * Switches between passive and LLM-backed response generation.
 */
export class ResponderService {
  private readonly passiveResponder: PassiveResponder;
  private readonly llmResponder: LlmResponder | null;
  private readonly mode: AppConfig["responderMode"];

  public constructor(config: AppConfig) {
    this.mode = config.responderMode;
    this.passiveResponder = new PassiveResponder(config.fallbackEmail);
    this.llmResponder = null;

    if (config.openAiApiKey) {
      this.llmResponder = new LlmResponder(config.openAiApiKey, config.openAiModel);
    }
  }

  /**
   * Returns the appropriate reply for the current responder mode.
   */
  public async respond(message: string, history: MessageRecord[]): Promise<string> {
    if (this.mode === "llm" && this.llmResponder) {
      return this.llmResponder.respond(message, history);
    }

    return this.passiveResponder.respond(message, history);
  }
}
