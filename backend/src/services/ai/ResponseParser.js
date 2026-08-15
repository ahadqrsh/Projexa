/**
 * Turns raw model text into validated, typed content.
 *
 * LLMs are probabilistic: even in JSON mode they occasionally wrap output in
 * markdown fences, prepend a sentence, or emit a trailing comma. Rather than trust
 * that, we repair what is safely repairable and then validate with Zod.
 *
 * The guarantee this file provides: nothing reaches MongoDB unless it matches the
 * generator's declared schema. A bad response becomes a clean `failed` artifact
 * with a retry button — never a crash, never corrupt data.
 */

import ApiError from '../../utils/ApiError.js';
import logger from '../../config/logger.js';

/** Strip ```json fences the model added despite being asked for raw JSON. */
const stripCodeFences = (text) =>
  text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

/** Grab the outermost {...} or [...] when the model prepends prose. */
const extractJsonBlock = (text) => {
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  const start =
    firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (start === -1) return text;

  const openChar = text[start];
  const closeChar = openChar === '{' ? '}' : ']';
  const end = text.lastIndexOf(closeChar);
  return end > start ? text.slice(start, end + 1) : text.slice(start);
};

/** Only structurally safe fixes. We never guess at missing values. */
const repairCommonIssues = (text) =>
  text
    .replace(/,(\s*[}\]])/g, '$1') // trailing commas
    .replace(/[“”]/g, '"') // smart double quotes
    .replace(/[‘’]/g, "'"); // smart single quotes

export const parseJson = (rawText, { artifactType = 'unknown' } = {}) => {
  const candidates = [
    rawText,
    stripCodeFences(rawText),
    extractJsonBlock(stripCodeFences(rawText)),
    repairCommonIssues(extractJsonBlock(stripCodeFences(rawText))),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next, more aggressive, repair
    }
  }

  logger.error(`JSON parse failed for ${artifactType}. First 300 chars: ${rawText.slice(0, 300)}`);
  throw ApiError.internal(
    `The AI returned malformed JSON for ${artifactType}. Please retry this module.`
  );
};

/**
 * Validate against the generator's Zod schema.
 * Zod errors are far more actionable than a Mongoose cast failure three layers later.
 */
export const validateAgainstSchema = (data, schema, { artifactType = 'unknown' } = {}) => {
  if (!schema) return data;

  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const issues = result.error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
    .join('; ');

  logger.error(`Schema validation failed for ${artifactType}: ${issues}`);
  // The specific field(s) that failed are far more useful on the failed artifact
  // card than a generic "didn't match" — this is what actually gets debugged
  // from, since most people don't have the server's terminal open.
  throw ApiError.internal(`The AI response for ${artifactType} did not match the expected structure: ${issues}`);
};

export const parseAndValidate = (rawText, schema, options = {}) =>
  validateAgainstSchema(parseJson(rawText, options), schema, options);

export default { parseJson, validateAgainstSchema, parseAndValidate };
