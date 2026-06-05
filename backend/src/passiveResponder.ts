import type { MessageRecord } from "./models";

interface ResponseRule {
  keywords: string[];
  reply: string;
}

const RESPONSE_RULES: ResponseRule[] = [
  {
    keywords: ["what is your return policy?"],
    reply:
      "Refund requests are reviewed after the item or shipment issue is confirmed. Please share your order details and we will help with the next step.",
  },
  {
    keywords: ["do you ship to the usa?"],
    reply:
      "Yes, we absolutely ship to the USA and deliver to all valid postal codes across the country. Please share your tracking number to check the status of your delivery.",
  },
  {
    keywords: ["how long does delivery take?"],
    reply:
      "Delivery times vary depending on the destination, shipping method selected, and product availability. Most orders are processed promptly and typically arrive within 3–7 business days for standard shipping within the USA",
  },
  {
    keywords: ["damaged", "broken", "claim"],
    reply:
      "If your package arrived damaged, please keep the packaging and send us your order number plus a short description so we can help with a claim.",
  },
];

/**
 * Returns predefined support responses for common shipping questions.
 */
export class PassiveResponder {
  private readonly fallbackEmail: string;

  public constructor(fallbackEmail: string) {
    this.fallbackEmail = fallbackEmail;
  }

  /**
   * Generates a passive reply from keyword rules and falls back to email support.
   */
  public async respond(
    message: string,
    _history: MessageRecord[],
  ): Promise<string> {
    const normalizedMessage = message.toLowerCase();
    console.log(normalizedMessage);

    for (const rule of RESPONSE_RULES) {
      const matched = rule.keywords.some((keyword) =>
        normalizedMessage.includes(keyword),
      );

      if (matched) {
        return rule.reply;
      }
    }

    return `We cannot help with that at the moment. Please email us at ${this.fallbackEmail} and our team will follow up with you.`;
  }
}
