import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as generationService from '../services/ai/generation.service.js';
import { HTTP } from '../config/constants.js';
import { artifactTypeFromSlug } from '../../../shared/constants/artifactTypes.js';

/**
 * 202 Accepted, not 200.
 * The work has been queued, not completed — the status code should say so, and
 * the client uses it to switch into polling mode.
 */
export const startGeneration = asyncHandler(async (req, res) => {
  const result = await generationService.startGeneration({
    project: req.project,
    user: req.user,
    modules: req.body.modules,
    force: req.body.force ?? false,
  });

  if (!result.jobId) {
    return res.status(HTTP.OK).json(ApiResponse.ok(result, result.message));
  }

  return res
    .status(HTTP.ACCEPTED)
    .json(
      ApiResponse.accepted(result, `Generation started for ${result.modules.length} module(s)`)
    );
});

export const generateAll = asyncHandler(async (req, res) => {
  const result = await generationService.generateAll({
    project: req.project,
    user: req.user,
    force: req.body?.force ?? false,
  });

  if (!result.jobId) {
    return res.status(HTTP.OK).json(ApiResponse.ok(result, result.message));
  }

  return res
    .status(HTTP.ACCEPTED)
    .json(ApiResponse.accepted(result, `Generating ${result.modules.length} module(s)`));
});

export const retryModule = asyncHandler(async (req, res) => {
  const type = artifactTypeFromSlug(req.params.type) ?? req.params.type.toUpperCase();
  const result = await generationService.retryModule({
    project: req.project,
    user: req.user,
    type,
  });
  res.status(HTTP.ACCEPTED).json(ApiResponse.accepted(result, `Retrying ${type}`));
});

export const getJobStatus = asyncHandler(async (req, res) => {
  const status = await generationService.getJobStatus(req.project._id, req.params.jobId);
  res.status(HTTP.OK).json(ApiResponse.ok(status, 'Job status fetched'));
});

export const cancelJob = asyncHandler(async (req, res) => {
  const result = generationService.cancelJob(req.params.jobId);
  res.status(HTTP.OK).json(ApiResponse.ok(result, 'Queued modules cancelled'));
});

/**
 * Server-Sent Events.
 *
 * Preferred over polling because the client learns of each module completing the
 * moment it happens, rather than up to 2 seconds later. The client falls back to
 * polling automatically if the connection drops — see Doc 04 section 5.
 */
export const streamJobStatus = asyncHandler(async (req, res) => {
  res.writeHead(HTTP.OK, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // stop proxies buffering the stream into uselessness
  });

  const { projectId, jobId } = req.params;
  let closed = false;

  const send = (event, data) => {
    if (closed) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const interval = setInterval(async () => {
    try {
      const status = await generationService.getJobStatus(projectId, jobId);
      send('progress', status);
      if (['completed', 'partial', 'failed', 'cancelled'].includes(status.overallStatus)) {
        send('done', status);
        clearInterval(interval);
        res.end();
      }
    } catch (error) {
      send('error', { message: error.message });
      clearInterval(interval);
      res.end();
    }
  }, 1500);

  req.on('close', () => {
    closed = true;
    clearInterval(interval);
  });
});
