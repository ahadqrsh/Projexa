import { GoogleGenerativeAI } from '@google/generative-ai';
import AIProvider from './AIProvider.js';
import env from '../../../config/env.js';
import ApiError from '../../../utils/ApiError.js';
import logger from '../../../config/logger.js';

class GeminiProvider extends AIProvider {
  constructor() {
    super({
      model: env.GEMINI_MODEL,
      timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
      maxRetries: env.AI_MAX_RETRIES,
    });
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  /**
   * Real bug this fixed: every Gemini SDK error message contains the literal
   * endpoint name "generateContent" (it's baked into the request URL the SDK
   * echoes back), and "generateContent" contains "rate" as a substring
   * (gene-RATE-Content). A plain `.includes('rate')` therefore matched EVERY
   * Gemini error — including a permanent 404 "model not found" — and
   * relabelled it as a transient "busy or over quota" failure, hiding the
   * real cause from both the logs and the user. Word-boundary regexes for the
   * word-based checks fix this; the numeric status-code checks were never
   * substring-ambiguous and are left as plain includes().
   */
  static isRetryable(error) {
    const message = String(error?.message ?? '').toLowerCase();
    return (
      message.includes('429') ||
      message.includes('503') ||
      message.includes('500') ||
      /\brate limit/.test(message) ||
      /\bquota\b/.test(message) ||
      /\btimed out\b/.test(message) ||
      /\boverloaded\b/.test(message) ||
      /\bfetch failed\b/.test(message) ||
      /\bresource_exhausted\b/.test(message)
    );
  }

  async generate(prompt, { json = true, temperature, maxOutputTokens, systemInstruction } = {}) {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction,
      generationConfig: {
        temperature: temperature ?? env.AI_TEMPERATURE,
        maxOutputTokens: maxOutputTokens ?? env.AI_MAX_OUTPUT_TOKENS,
        /**
         * Native JSON mode. This is far more reliable than asking politely for JSON
         * in the prompt and then repairing markdown fences on the way out.
         */
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    });

    const { result, attempts } = await this.withRetry(
      () => this.withTimeout(model.generateContent(prompt)),
      { isRetryable: GeminiProvider.isRetryable }
    ).catch((error) => {
      logger.error(`Gemini request failed: ${error.message}`);
      if (GeminiProvider.isRetryable(error)) {
        throw ApiError.serviceUnavailable(
          'The AI service is busy or over quota. Please try again shortly.'
        );
      }
      throw ApiError.internal(`AI generation failed: ${error.message}`);
    });

    const response = result.response;
    const text = response.text();

    if (!text || !text.trim()) {
      throw ApiError.internal('The AI returned an empty response.');
    }

    const usage = response.usageMetadata ?? {};
    return {
      text,
      model: this.model,
      attempts,
      usage: {
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
      },
    };
  }
}

export default GeminiProvider;
export { GeminiProvider };
