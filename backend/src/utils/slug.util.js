import slugify from 'slugify';
import { customAlphabet } from 'nanoid';

const nano = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4);

/**
 * Slugs get a short random suffix rather than a "-2", "-3" counter.
 * A counter requires a read-then-write, which races under concurrent creates;
 * a random suffix is collision-safe in one write and leaks no ordering information.
 */
export const createSlug = (title) => {
  const base = slugify(String(title), { lower: true, strict: true, trim: true }).slice(0, 80);
  return `${base || 'project'}-${nano()}`;
};

export const createJobId = () => `gen_${customAlphabet('abcdef0123456789', 12)()}`;
