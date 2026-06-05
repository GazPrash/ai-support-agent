import OpenAI from "openai";
import type { MessageRecord } from "./models.js";

/**
 * Calls the LLM provider using recent conversation history as context.
 */
export class LlmResponder {
  private readonly client: OpenAI;
  private readonly model: string;

  public constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Generates a support response using the configured LLM model.
   */
  public async respond(message: string, history: MessageRecord[]): Promise<string> {
    const conversationTranscript = history
      .map((item) => {
        let speaker = "Agent";

        if (item.sender === "user") {
          speaker = "Customer";
        }

        return `${speaker}: ${item.text}`;
      })
      .join("\n");

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are pshr Support Agent, a helpful shipping company assistant. Answer clearly and briefly. If the request cannot be answered from a general shipping support perspective, tell the customer to email support.",
        },
        {
          role: "user",
          content: `Recent conversation:\n${conversationTranscript}\n\nLatest customer message:\n${message}`,
        },
      ],
    });

    const reply = response.choices[0]?.message?.content?.trim();

    if (!reply) {
      return "We cannot help with that at the moment. Please email us for further assistance.";
    }

    return reply;
  }
}
