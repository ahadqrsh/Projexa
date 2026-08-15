/**
 * Appended to every prompt.
 *
 * Belt and braces: providers are also set to native JSON mode, but models still
 * occasionally add prose. Stating the contract explicitly measurably reduces the
 * repair work ResponseParser has to do.
 */

export const buildOutputContract = (shapeDescription) => `
OUTPUT FORMAT — follow exactly:
- Respond with a single valid JSON object and nothing else.
- No markdown code fences, no commentary before or after the JSON.
- Use exactly these keys, with no additional top-level keys:

${shapeDescription}

- Every string must be plain text. Do not embed markdown formatting.
- Do not include trailing commas.`;

export default buildOutputContract;
