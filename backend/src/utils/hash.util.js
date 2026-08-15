/**
 * SHA-256 helpers.
 *
 * Used for two distinct purposes:
 *  1. One-time tokens (email verification, password reset, refresh tokens). We email
 *     or cookie the RAW token and store only its hash, so a database leak cannot be
 *     replayed — the same reasoning as password hashing.
 *  2. `ideaHash` — a deterministic fingerprint of a project idea used both for
 *     staleness detection and as the generation cache key.
 */

import crypto from 'node:crypto';
import { IDEA_HASH_FIELDS } from '../config/constants.js';

export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

/** Raw token goes to the user; hash goes to the database. */
export const createHashedToken = (bytes = 32) => {
  const raw = randomToken(bytes);
  return { raw, hashed: sha256(raw) };
};

/**
 * Stable fingerprint of the idea fields.
 * Normalisation matters: sorting arrays and lowercasing means reordering
 * `preferredTech` does not falsely invalidate every artifact.
 */
export const computeIdeaHash = (project) => {
  const normalised = IDEA_HASH_FIELDS.map((field) => {
    const value = project?.[field];
    if (Array.isArray(value)) {
      return `${field}:${[...value].map((v) => String(v).trim().toLowerCase()).sort().join('|')}`;
    }
    if (value === undefined || value === null) return `${field}:`;
    return `${field}:${String(value).trim().toLowerCase().replace(/\s+/g, ' ')}`;
  }).join('||');

  return sha256(normalised);
};

/** Constant-time comparison for token checks. */
export const safeCompare = (a = '', b = '') => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};
