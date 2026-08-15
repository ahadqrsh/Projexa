/**
 * The AI provider interface (Dependency Inversion).
 *
 * Generators depend on THIS abstraction, never on @google/generative-ai. That is
 * what makes `AI_PROVIDER=openai` a one-line environment change rather than a
 * refactor — which matters the day Gemini's free-tier quota runs out mid-demo.
 *
 * Contract:
 *   generate(prompt, options) -> { text, usage: { promptTokens, completionTokens }, model }
 *   Must throw ApiError on failure. Must never return partial or undefined text.
 */

class AIProvider {
  constructor({ model, timeoutMs, maxRetries }) {
    if (new.target === AIProvider) {
      throw new Error('AIProvider is abstract and cannot be instantiated directly');
    }
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
  }

  // eslint-disable-next-line no-unused-vars
  async generate(prompt, options = {}) {
    throw new Error(`${this.constructor.name} must implement generate()`);
  }

  get name() {
    return this.constructor.name.replace('Provider', '').toLowerCase();
  }

  /**
   * Shared retry with exponential backoff + jitter.
   *
   * Only transient failures are retried (429, 5xx, timeouts). Retrying a 400 just
   * burns quota to receive the same rejection three times. Jitter prevents three
   * queued modules from retrying in lockstep and re-triggering the same rate limit.
   *
   * Backoff base is 3s (attempt 1 ~6.4s, attempt 2 ~12.8s, ~19s total across two
   * retries). This used to be a 400ms base (~2.5s total across two retries), which
   * is long enough to survive a 5xx blip but does nothing against a free-tier
   * per-MINUTE request quota (Gemini's free tier is commonly 10-15 RPM) — a module
   * that gets 429'd because the previous ~12 modules in the same generation batch
   * already used up this minute's quota would just get 429'd again 2.5s later and
   * permanently fail. A longer backoff gives the per-minute window a real chance
   * to roll over before the retry fires.
   */
  async withRetry(operation, { isRetryable }) {
    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt += 1) {
      try {
        return { result: await operation(), attempts: attempt };
      } catch (error) {
        lastError = error;
        const canRetry = attempt <= this.maxRetries && isRetryable(error);
        if (!canRetry) break;
        const backoff = 2 ** attempt * 3000 + Math.random() * 800;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    throw lastError;
  }

  /** Wall-clock guard — a hung provider must not hold a queue slot forever. */
  withTimeout(promise) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`AI request timed out after ${this.timeoutMs}ms`)),
          this.timeoutMs
        )
      ),
    ]);
  }
}

export default AIProvider;
export { AIProvider };
