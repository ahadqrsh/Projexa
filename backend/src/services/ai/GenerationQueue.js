/**
 * Concurrency-limited in-process job queue.
 *
 * WHY NOT SYNCHRONOUS: generating all modules takes 60-180s, which exceeds
 * Render's 100s request timeout.
 *
 * WHY NOT BULLMQ (yet): it needs Redis, which is real infrastructure and cost for
 * an academic project. Everything here depends on this class's INTERFACE, so
 * swapping in BullMQ later changes exactly this one file.
 *
 * ACCEPTED TRADE-OFF: a server restart loses in-flight work. Mitigated by the
 * boot-time reconciliation sweep in jobs/reconcileStuckArtifacts.job.js, which
 * flips abandoned "generating" rows to "failed" so the UI is never permanently wrong.
 */

import PQueue from 'p-queue';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { JOB_STATUS } from '../../../../shared/constants/statuses.js';

class GenerationQueue {
  constructor({ concurrency = env.AI_QUEUE_CONCURRENCY } = {}) {
    this.queue = new PQueue({ concurrency });
    /** jobId -> live progress. Ephemeral; artifact rows are the durable source of truth. */
    this.jobs = new Map();
  }

  createJob(jobId, moduleTypes) {
    this.jobs.set(jobId, {
      jobId,
      status: JOB_STATUS.QUEUED,
      startedAt: new Date(),
      modules: moduleTypes.map((type) => ({ type, status: 'queued' })),
    });
    return this.jobs.get(jobId);
  }

  getJob(jobId) {
    return this.jobs.get(jobId) ?? null;
  }

  updateModule(jobId, type, patch) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const entry = job.modules.find((m) => m.type === type);
    if (entry) Object.assign(entry, patch);
  }

  /**
   * Enqueue an ordered batch.
   *
   * Modules run SEQUENTIALLY within a job — not because of the concurrency limit,
   * but because a dependent module must read the completed output of its
   * dependency. p-queue's concurrency governs how many separate USERS' jobs run
   * at once, protecting the provider rate limit.
   */
  enqueueBatch({ jobId, orderedTypes, runner, onComplete }) {
    const job = this.createJob(jobId, orderedTypes);

    this.queue
      .add(async () => {
        job.status = JOB_STATUS.RUNNING;

        for (const [index, type] of orderedTypes.entries()) {
          // Pace requests to stay under free-tier per-minute quotas (commonly
          // 10-15 RPM on Gemini's free tier). A batch of 16 sequential modules
          // with no pacing bursts well past that within the first minute, so the
          // later modules in the batch (e.g. module #13, #16) reliably 429 even
          // though nothing is wrong with them individually. A short gap between
          // requests is cheap insurance against that — ~1.5s added 15 times is
          // 22s on a batch that already takes minutes.
          if (index > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          this.updateModule(jobId, type, { status: 'generating', startedAt: new Date() });
          const startedAt = Date.now();

          // runner never throws: BaseGenerator converts failure into a result object.
          const result = await runner(type);

          this.updateModule(jobId, type, {
            status: result.status,
            durationMs: Date.now() - startedAt,
            error: result.error,
          });
        }

        const failed = job.modules.filter((m) => m.status === 'failed').length;
        job.status =
          failed === 0
            ? JOB_STATUS.COMPLETED
            : failed === job.modules.length
              ? JOB_STATUS.FAILED
              : JOB_STATUS.PARTIAL; // some succeeded — a first-class outcome, not an error

        job.finishedAt = new Date();

        if (onComplete) await onComplete(job);

        // Free memory after a grace period; clients poll the artifact rows afterwards.
        setTimeout(() => this.jobs.delete(jobId), 10 * 60 * 1000).unref?.();
      })
      .catch((error) => {
        logger.error(`Generation job ${jobId} crashed: ${error.message}`);
        job.status = JOB_STATUS.FAILED;
      });

    return job;
  }

  cancel(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    // Only queued modules can be cancelled; an in-flight API call cannot be recalled.
    job.modules.forEach((m) => {
      if (m.status === 'queued') m.status = 'cancelled';
    });
    job.status = JOB_STATUS.CANCELLED;
    return true;
  }

  get stats() {
    return { size: this.queue.size, pending: this.queue.pending, activeJobs: this.jobs.size };
  }
}

export const generationQueue = new GenerationQueue();
export { GenerationQueue };
export default generationQueue;
