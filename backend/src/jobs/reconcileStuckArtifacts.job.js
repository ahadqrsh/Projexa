/**
 * Boot-time reconciliation.
 *
 * The generation queue is in-process, so a restart or crash abandons in-flight
 * work. Those artifact rows would sit at "generating" forever and the UI would
 * show a spinner that never resolves.
 *
 * Running this at boot means the worst case is "failed, please retry" — honest and
 * actionable — rather than a permanently wrong interface. This is the explicit
 * mitigation for the trade-off documented in GenerationQueue.js.
 */

import { artifactRepository } from '../repositories/artifact.repository.js';
import env from '../config/env.js';
import logger from '../config/logger.js';

export const reconcileStuckArtifacts = async () => {
  const cutoff = new Date(Date.now() - env.STUCK_JOB_TIMEOUT_MINUTES * 60_000);
  const result = await artifactRepository.sweepStuck(cutoff);

  if (result.modifiedCount) {
    logger.warn(`Reconciled ${result.modifiedCount} artifact(s) abandoned by a previous process`);
  }
  return result.modifiedCount ?? 0;
};

export default reconcileStuckArtifacts;
