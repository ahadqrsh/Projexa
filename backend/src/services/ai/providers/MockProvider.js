import AIProvider from './AIProvider.js';
import env from '../../../config/env.js';
import { getMockFixture } from './mockFixtures.js';

/**
 * Deterministic offline provider. Not a toy — it is load-bearing:
 *
 *  • `npm run dev` works on a fresh clone with no API key.
 *  • The integration suite exercises the FULL pipeline (queue, parser, Zod
 *    validation, persistence, logging) with zero cost and zero flakiness.
 *  • Frontend work in Phase 4+ never blocks on quota.
 *
 * config/env.js refuses to boot with AI_PROVIDER=mock in production.
 */
class MockProvider extends AIProvider {
  constructor() {
    super({ model: 'mock', timeoutMs: 5000, maxRetries: 0 });
  }

  async generate(prompt, { artifactType, project } = {}) {
    // Small delay so loading states are actually observable during development.
    await new Promise((resolve) => setTimeout(resolve, env.isTest ? 0 : 250));

    const fixture = getMockFixture(artifactType, project);
    const text = JSON.stringify(fixture);

    return {
      text,
      model: 'mock',
      attempts: 1,
      usage: {
        // Rough 4-chars-per-token heuristic — enough for the usage dashboard to be non-empty.
        promptTokens: Math.ceil(String(prompt).length / 4),
        completionTokens: Math.ceil(text.length / 4),
      },
    };
  }
}

export default MockProvider;
export { MockProvider };
