/**
 * Token -> USD estimation for the admin AI-usage dashboard.
 * Prices are per 1M tokens and are configuration, not logic: update the table
 * when providers change pricing.
 */

const PRICING = {
  // Current (standard tier, per Google's published pricing as of Aug 2026).
  'gemini-3.6-flash': { input: 1.5, output: 7.5 },
  'gemini-3.5-flash': { input: 1.5, output: 9.0 },
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },

  // Retired models. Kept so cost history on artifacts generated before a model
  // migration still reports the rate that was actually charged at the time,
  // rather than silently falling back to today's (wrong) pricing.
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  'gemini-1.5-flash-8b': { input: 0.0375, output: 0.15 },
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },

  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  mock: { input: 0, output: 0 },
};

const FALLBACK = { input: 0.1, output: 0.4 };

export const estimateCostUsd = (model, promptTokens = 0, completionTokens = 0) => {
  const rate = PRICING[model] ?? FALLBACK;
  const cost = (promptTokens / 1_000_000) * rate.input + (completionTokens / 1_000_000) * rate.output;
  return Number(cost.toFixed(6));
};

export const getPricingTable = () => ({ ...PRICING });
