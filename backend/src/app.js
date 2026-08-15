/**
 * Express application assembly.
 *
 * app.js has NO side effects — it does not listen, connect to a database, or start
 * a scheduler. That separation is what lets Supertest do `request(app)` against an
 * in-memory MongoDB with no port binding. All side effects live in server.js.
 *
 * MIDDLEWARE ORDER IS LOAD-BEARING. Each comment below explains why a layer sits
 * where it does; reordering them introduces subtle security or parsing bugs.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';

import env from './config/env.js';
import { corsOptions } from './config/corsOptions.js';
import { apiLimiter } from './config/rateLimiters.js';
import { morganStream } from './config/logger.js';
import { requestId } from './middlewares/requestId.middleware.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import v1Routes from './routes/v1/index.js';

const app = express();

/**
 * Render terminates TLS at its proxy. Without this, req.ip is the proxy's address,
 * which would put every user in the world into a single rate-limit bucket, and
 * `secure` cookies would never be set.
 */
app.set('trust proxy', 1);
app.disable('x-powered-by');

// 1. Trace id first — everything after it can log with a correlatable id.
app.use(requestId);

// 2. Security headers before anything can produce a response.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // client is on another origin
    contentSecurityPolicy: env.isProduction ? undefined : false,
  })
);

// 3. CORS before body parsing so preflight OPTIONS is answered cheaply.
app.use(cors(corsOptions));

// 4. Parsers. The 1mb cap is deliberate: our largest legitimate body is a manual
//    artifact edit. Uploads never pass through here — Multer handles those.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// 5. Sanitisation AFTER parsing (there is nothing to sanitise before) and BEFORE
//    any route sees the data. Strips $ and . so `{"email": {"$gt": ""}}` cannot
//    become a NoSQL operator injection at the login endpoint.
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(hpp({ whitelist: ['tags', 'preferredTech', 'modules', 'sections'] }));

// 6. Compression. Artifact JSON compresses 6-8x.
app.use(compression());

// 7. Access logs.
app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: morganStream,
    skip: () => env.isTest,
  })
);

// 8. Global rate limit, applied only to the API surface.
app.use('/api', apiLimiter);

// 9. Routes.
app.use('/api/v1', v1Routes);

app.get('/', (_req, res) => {
  res.json({
    name: env.APP_NAME,
    version: '1.0.0',
    status: 'running',
    docs: '/api/v1/health',
  });
});

// 10. Unmatched routes become a 404 ApiError...
app.use(notFound);

// 11. ...and every error in the application converges here. Must be last.
app.use(errorHandler);

export default app;
