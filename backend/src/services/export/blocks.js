/**
 * A tiny, format-agnostic intermediate representation (IR).
 *
 * Every module formatter in moduleFormatters.js turns one artifact's `content`
 * into an array of these blocks. Markdown, PDF and DOCX builders each walk the
 * SAME array and render it in their own format — so adding a 17th module type
 * only ever needs one new formatter, never three.
 */

export const heading = (text, level = 2) => ({ kind: 'heading', level, text });
export const paragraph = (text) => ({ kind: 'paragraph', text });
export const list = (items, ordered = false) => ({ kind: 'list', items: items.filter(Boolean), ordered });
export const table = (headers, rows) => ({ kind: 'table', headers, rows });
export const keyValue = (pairs) => ({ kind: 'keyValue', pairs: pairs.filter(([, v]) => v !== undefined && v !== null && v !== '') });
export const spacer = () => ({ kind: 'spacer' });

export default { heading, paragraph, list, table, keyValue, spacer };
