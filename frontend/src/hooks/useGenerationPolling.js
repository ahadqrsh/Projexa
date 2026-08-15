import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { pollJobStatus, selectJob } from '@/features/generation/generationSlice';

const TERMINAL = ['completed', 'partial', 'failed', 'cancelled'];
const POLL_INTERVAL_MS = 1500;

/**
 * Polls a job until it reaches a terminal state, then stops itself.
 *
 * Polling (not SSE) on purpose: the backend does offer an SSE stream, but
 * polling degrades gracefully through proxies, ad blockers and flaky campus
 * wifi in a way that a long-lived connection does not — and at a 1.5s
 * interval the perceived difference is negligible for a job that takes
 * roughly 10 seconds per module.
 */
export const useGenerationPolling = (projectId, jobId) => {
  const dispatch = useDispatch();
  const job = useSelector(selectJob(projectId));
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!jobId) return undefined;

    const tick = () => dispatch(pollJobStatus({ projectId, jobId }));
    tick(); // fetch immediately rather than waiting a full interval for the first paint

    intervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [dispatch, projectId, jobId]);

  // Stop polling as soon as the job reaches a terminal state, even if the
  // interval has not fired again yet.
  useEffect(() => {
    if (job && TERMINAL.includes(job.overallStatus) && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [job?.overallStatus]);

  return job;
};

export default useGenerationPolling;
