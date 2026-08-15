import env from '../../../config/env.js';
import GeminiProvider from './GeminiProvider.js';
import OpenAIProvider from './OpenAIProvider.js';
import MockProvider from './MockProvider.js';
import logger from '../../../config/logger.js';

const registry = {
  gemini: GeminiProvider,
  openai: OpenAIProvider,
  mock: MockProvider,
};

let instance = null;

/**
 * Factory + singleton.
 *
 * Nothing else in the codebase constructs a provider, so switching models is a
 * single environment variable. This is the concrete payoff of depending on the
 * AIProvider abstraction rather than on a vendor SDK.
 */
export const getAIProvider = () => {
  if (!instance) {
    const Provider = registry[env.AI_PROVIDER] ?? MockProvider;
    instance = new Provider();
    logger.info(`AI provider: ${env.AI_PROVIDER} (model: ${instance.model})`);
  }
  return instance;
};

/** Test seam. */
export const setAIProvider = (provider) => {
  instance = provider;
};

export default getAIProvider;
