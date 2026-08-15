/**
 * Winston logger.
 * Pretty + coloured in development; single-line JSON in production so Render's
 * log drain and any future aggregator can parse it.
 */

import winston from 'winston';
import env from './env.js';

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack, requestId, ...meta }) => {
  const rid = requestId ? ` [${String(requestId).slice(0, 8)}]` : '';
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} ${level}${rid}: ${stack || message}${extra}`;
});

const transports = [
  new winston.transports.Console({
    format: env.isProduction
      ? combine(timestamp(), errors({ stack: true }), splat(), json())
      : combine(
          colorize({ level: true }),
          timestamp({ format: 'HH:mm:ss' }),
          errors({ stack: true }),
          splat(),
          devFormat
        ),
  }),
];

if (env.LOG_TO_FILE) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json()),
      maxsize: 5_242_880,
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json()),
      maxsize: 5_242_880,
      maxFiles: 3,
    })
  );
}

export const logger = winston.createLogger({
  level: env.isTest ? 'error' : env.LOG_LEVEL,
  silent: env.isTest,
  defaultMeta: { service: 'apm-api' },
  transports,
  exitOnError: false,
});

/** Morgan pipes HTTP access lines through Winston so we have one log stream, not two. */
export const morganStream = {
  write: (message) => logger.http(message.trim()),
};

export default logger;
