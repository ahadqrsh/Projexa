/**
 * Environment loading + validation.
 *
 * WHY THIS FILE EXISTS
 * Reading `process.env.X` at the point of use means a missing variable surfaces as
 * `undefined` deep inside a request, hours after deploy, as a confusing runtime error.
 * We instead parse and validate the ENTIRE environment once, at boot, with Zod.
 * A misconfigured server refuses to start and prints exactly what is wrong.
 *
 * Nothing else in the codebase may read `process.env` directly.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/** Coerce "true"/"false" strings into real booleans. */
const boolish = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => v === true || v === 'true');

/** Comma-separated string -> trimmed array. */
const csv = z
  .string()
  .default('')
  .transform((v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );

const isProd = process.env.NODE_ENV === 'production';

/** Secrets must be long in production; relaxed in dev/test so contributors can start fast. */
const secret = (name) =>
  z
    .string({ required_error: `${name} is required` })
    .min(isProd ? 32 : 16, `${name} must be at least ${isProd ? 32 : 16} characters`);

const schema = z
  .object({
    // Core
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8000),
    API_VERSION: z.string().default('v1'),
    APP_NAME: z.string().default('Projexa'),

    // URLs
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    SERVER_URL: z.string().url().default('http://localhost:8000'),
    CORS_ORIGINS: csv,

    // Database
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    MONGODB_URI_TEST: z.string().optional(),

    // JWT
    JWT_ACCESS_SECRET: secret('JWT_ACCESS_SECRET'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: secret('JWT_REFRESH_SECRET'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    COOKIE_SECRET: secret('COOKIE_SECRET'),

    // Passwords & tokens
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    EMAIL_VERIFICATION_EXPIRES_HOURS: z.coerce.number().int().positive().default(24),
    PASSWORD_RESET_EXPIRES_MINUTES: z.coerce.number().int().positive().default(30),

    // AI
    AI_PROVIDER: z.enum(['gemini', 'openai', 'mock']).default('mock'),
    GEMINI_API_KEY: z.string().optional().default(''),
    GEMINI_MODEL: z.string().default('gemini-3.6-flash'),
    OPENAI_API_KEY: z.string().optional().default(''),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(8192),
    AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
    AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
    AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
    AI_QUEUE_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(3),

    // Quotas
    DEFAULT_AI_CREDITS: z.coerce.number().int().positive().default(200),
    CREDIT_RESET_DAYS: z.coerce.number().int().positive().default(30),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
    CLOUDINARY_API_KEY: z.string().optional().default(''),
    CLOUDINARY_API_SECRET: z.string().optional().default(''),
    CLOUDINARY_FOLDER: z.string().default('ai-project-mentor'),

    // Uploads
    MAX_AVATAR_SIZE_MB: z.coerce.number().positive().default(2),
    MAX_COVER_SIZE_MB: z.coerce.number().positive().default(3),
    ALLOWED_IMAGE_TYPES: csv,

    // Email
    SMTP_HOST: z.string().optional().default(''),
    SMTP_PORT: z.coerce.number().int().default(587),
    SMTP_SECURE: boolish.default(false),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASSWORD: z.string().optional().default(''),
    EMAIL_FROM_NAME: z.string().default('Projexa'),
    EMAIL_FROM_ADDRESS: z.string().default('noreply@aiprojectmentor.com'),

    // Rate limiting
    RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
    GENERATION_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
    EXPORT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(15),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
    LOG_TO_FILE: boolish.default(false),

    // Jobs
    ENABLE_CRON: boolish.default(true),
    PURGE_DELETED_AFTER_DAYS: z.coerce.number().int().positive().default(30),
    STUCK_JOB_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(5),
    REPORT_TTL_DAYS: z.coerce.number().int().positive().default(30),
  })
  /**
   * Cross-field rules. These catch the misconfigurations that are individually
   * "valid" but combine into a broken or insecure server.
   */
  .superRefine((cfg, ctx) => {
    if (cfg.JWT_ACCESS_SECRET === cfg.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message:
          'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET. If they match, a stolen ' +
          '15-minute access token is also a valid 7-day refresh token.',
      });
    }
    if (cfg.AI_PROVIDER === 'gemini' && !cfg.GEMINI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GEMINI_API_KEY'],
        message: 'GEMINI_API_KEY is required when AI_PROVIDER=gemini.',
      });
    }
    if (cfg.AI_PROVIDER === 'openai' && !cfg.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY is required when AI_PROVIDER=openai.',
      });
    }
    if (cfg.NODE_ENV === 'production' && cfg.AI_PROVIDER === 'mock') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AI_PROVIDER'],
        message: 'AI_PROVIDER=mock is a development fixture and must not be used in production.',
      });
    }
    if (cfg.NODE_ENV === 'production' && cfg.CORS_ORIGINS.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS must list your deployed client origin in production.',
      });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  // Deliberately console.error: the logger itself depends on this config.
  console.error(`\n✖ Invalid environment configuration:\n${issues}\n`);
  console.error('Copy .env.example to .env and fill in the missing values.\n');
  process.exit(1);
}

const raw = parsed.data;

/** Derived / grouped config. Consumers read this, never process.env. */
export const env = Object.freeze({
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  mongoUri: raw.NODE_ENV === 'test' ? (raw.MONGODB_URI_TEST ?? raw.MONGODB_URI) : raw.MONGODB_URI,
  cloudinaryEnabled: Boolean(
    raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET
  ),
  smtpEnabled: Boolean(raw.SMTP_HOST && raw.SMTP_USER),
});

export default env;
