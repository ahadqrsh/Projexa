import cron from 'node-cron';
import logger from '../config/logger.js';
import { purgeDeletedProjects } from './purgeDeletedProjects.job.js';
import { reconcileStuckArtifacts } from './reconcileStuckArtifacts.job.js';

const tasks = [];

const register = (name, expression, handler) => {
  const task = cron.schedule(expression, async () => {
    try {
      await handler();
    } catch (error) {
      // A failing cron job must never take the API process down with it.
      logger.error(`Scheduled job "${name}" failed: ${error.message}`);
    }
  });
  tasks.push(task);
  logger.info(`Scheduled job registered: ${name} (${expression})`);
};

export const startScheduler = () => {
  register('purgeDeletedProjects', '0 3 * * *', purgeDeletedProjects); // 03:00 daily
  register('reconcileStuckArtifacts', '*/10 * * * *', reconcileStuckArtifacts); // every 10 min
};

export const stopScheduler = () => {
  tasks.forEach((task) => task.stop());
  tasks.length = 0;
};

export default { startScheduler, stopScheduler };
