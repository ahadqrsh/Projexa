import OpenAI from 'openai';
import AIProvider from './AIProvider.js';
import env from '../../../config/env.js';
import ApiError from '../../../utils/ApiError.js';
import logger from '../../../config/logger.js';

/**
 * Drop-in substitute for GeminiProvider (Liskov Substitution).
 * GenerationService cannot tell the two apart — same method, same return shape.
 */
class OpenAIProvider extends AIProvider {
  constructor() {
    super({
      model: env.OPENAI_MODEL,
      timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
      maxRetries: env.AI_MAX_RETRIES,
    });
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: env.AI_REQUEST_TIMEOUT_MS });
  }

  static isRetryable(error) {
    const status = error?.status ?? error?.response?.status;
    if (status === 429 || (status >= 500 && status < 600)) return true;
    return String(error?.message ?? '').toLowerCase().includes('timed out');
  }

  async generate(prompt, { json = true, temperature, maxOutputTokens, systemInstruction } = {}) {
    const { result, attempts } = await this.withRetry(
      () =>
        this.withTimeout(
          this.client.chat.completions.create({
            model: this.model,
            temperature: temperature ?? env.AI_TEMPERATURE,
            max_tokens: maxOutputTokens ?? env.AI_MAX_OUTPUT_TOKENS,
            ...(json ? { response_format: { type: 'json_object' } } : {}),
            messages: [
              ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
              { role: 'user', content: prompt },
            ],
          })
        ),
      { isRetryable: OpenAIProvider.isRetryable }
    ).catch((error) => {
      logger.error(`OpenAI request failed: ${error.message}`);
      if (OpenAIProvider.isRetryable(error)) {
        throw ApiError.serviceUnavailable(
          'The AI service is busy or over quota. Please try again shortly.'
        );
      }
      throw ApiError.internal(`AI generation failed: ${error.message}`);
    });

    const text = result.choices?.[0]?.message?.content;
    if (!text || !text.trim()) throw ApiError.internal('The AI returned an empty response.');

    return {
      text,
      model: this.model,
      attempts,
      usage: {
        promptTokens: result.usage?.prompt_tokens ?? 0,
        completionTokens: result.usage?.completion_tokens ?? 0,
      },
    };
  }
}

export default OpenAIProvider;
export { OpenAIProvider };
