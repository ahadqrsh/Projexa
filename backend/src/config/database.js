/**
 * MongoDB connection lifecycle.
 *
 * Retries with exponential backoff because Atlas and Render do not start in a
 * guaranteed order: a cold Render container can boot before its network route to
 * Atlas is ready, and crashing on the first attempt turns a transient blip into a
 * failed deploy.
 */

import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

mongoose.set('strictQuery', true);
if (env.isDevelopment) mongoose.set('debug', false);

let isConnected = false;

export const connectDatabase = async ({ uri = env.mongoUri, maxRetries = 5 } = {}) => {
  if (isConnected) return mongoose.connection;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        autoIndex: !env.isProduction, // build indexes in dev; use migrations in prod
      });

      isConnected = true;
      logger.info(`MongoDB connected → ${mongoose.connection.name}`);
      return mongoose.connection;
    } catch (error) {
      const isLast = attempt === maxRetries;
      logger.error(
        `MongoDB connection attempt ${attempt}/${maxRetries} failed: ${error.message}`
      );
      if (isLast) throw error;
      const backoffMs = Math.min(2 ** attempt * 500, 8000);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
  return mongoose.connection;
};

export const disconnectDatabase = async () => {
  if (!isConnected) return;
  await mongoose.connection.close(false);
  isConnected = false;
  logger.info('MongoDB disconnected');
};

export const getDatabaseState = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    status: states[mongoose.connection.readyState] ?? 'unknown',
    name: mongoose.connection.name ?? null,
  };
};

mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('MongoDB reconnected');
});

export default connectDatabase;
