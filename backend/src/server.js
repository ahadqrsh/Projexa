/**
 * Process entry point. Owns every side effect.
 *
 * Boot order matters: validate config (already done at import of env.js), connect
 * the database, reconcile work abandoned by the previous process, start the
 * scheduler, then accept traffic. Serving requests before the database is ready
 * would return confusing 500s during the first seconds of a deploy.
 */

import http from 'node:http';
import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { reconcileStuckArtifacts } from './jobs/reconcileStuckArtifacts.job.js';
import { startScheduler, stopScheduler } from './jobs/scheduler.js';

const server = http.createServer(app);

const start = async () => {
  try {
    await connectDatabase();
    await reconcileStuckArtifacts();
    if (env.ENABLE_CRON) startScheduler();

    server.listen(env.PORT, () => {
      logger.info(`${env.APP_NAME} API listening on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`Health check: ${env.SERVER_URL}/api/v1/health`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Graceful shutdown.
 *
 * Render sends SIGTERM before replacing a container. Closing the HTTP server first
 * lets in-flight requests finish; only then do we close the database. The 10s
 * force-exit guard stops a wedged connection hanging the deploy forever.
 */
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    stopScheduler();
    await new Promise((resolve) => server.close(resolve));
    await disconnectDatabase();
    clearTimeout(forceExit);
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

/**
 * A rejection that reached here escaped asyncHandler, which means it is a bug
 * outside the request cycle. Log it and restart rather than continue in an
 * unknown state — the process manager will bring us back cleanly.
 */
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason?.message ?? reason}`, { stack: reason?.stack });
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

start();

export default server;
