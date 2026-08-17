import { z } from 'zod';

/**
 * A z.enum() that tolerates the two failure modes real LLM output actually
 * exhibits, instead of hard-failing the whole artifact on either one:
 *
 *  1. Wrong casing — the model returns "Frontend" / "Database" instead of
 *     "frontend" / "database". Trivially fixed by lowercasing first.
 *  2. A reasonable-but-not-in-the-list synonym — e.g. a project with an IoT
 *     component has the model invent a "IoT MQTT Broker" deployment
 *     component or an "iot-broker" cost category, because the fixed enum
 *     never anticipated that domain. The synonym table maps known near-misses
 *     onto the closest real bucket.
 *
 * Anything that survives both steps still goes through the real z.enum(). If
 * the value list includes an "other" bucket, a value that is STILL unmapped
 * at that point (a genuinely novel phrase like "IoT MQTT Broker" with no
 * exact synonym entry) falls into "other" rather than failing the whole
 * artifact — "other" already means "doesn't fit elsewhere" by definition, so
 * this is a safe default, not a silent data-quality compromise. Enums with no
 * "other" bucket (e.g. billingCycle) get no such fallback and still fail
 * validation on a truly unrecognised value, exactly as before.
 */
export const lenientEnum = (values, synonyms = {}) =>
  z.preprocess((val) => {
    if (typeof val !== 'string') return val;
    const normalised = val.trim().toLowerCase();
    const mapped = synonyms[normalised] ?? normalised;
    if (!values.includes(mapped) && values.includes('other')) return 'other';
    return mapped;
  }, z.enum(values));

export default { lenientEnum };
