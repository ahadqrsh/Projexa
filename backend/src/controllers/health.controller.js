import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { getDatabaseState } from '../config/database.js';
import { getQueueStats } from '../services/ai/generation.service.js';
import { getImplementedTypes } from '../services/ai/GeneratorRegistry.js';
import env from '../config/env.js';
import { HTTP } from '../config/constants.js';
import { DOMAINS, DIFFICULTIES, PROJECT_TYPES } from '../../../shared/constants/domains.js';
import { ARTIFACT_TYPE_LIST, ARTIFACT_GROUPS } from '../../../shared/constants/artifactTypes.js';
import { TASK_CATEGORY, TASK_PRIORITY } from '../../../shared/constants/statuses.js';
import { ROLE_LIST } from '../../../shared/constants/roles.js';

/** Consumed by Render's health check. Must stay cheap — no heavy queries. */
export const health = asyncHandler(async (_req, res) => {
  const database = getDatabaseState();
  const healthy = database.status === 'connected';

  const payload = {
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    version: '1.0.0',
    database,
    aiProvider: { provider: env.AI_PROVIDER, modulesImplemented: getImplementedTypes().length },
    queue: getQueueStats(),
    timestamp: new Date().toISOString(),
  };

  res
    .status(healthy ? HTTP.OK : HTTP.SERVICE_UNAVAILABLE)
    .json(
      new ApiResponse(
        healthy ? HTTP.OK : HTTP.SERVICE_UNAVAILABLE,
        payload,
        healthy ? 'Service healthy' : 'Database unavailable'
      )
    );
});

/**
 * Single source of enums for the client.
 * Adding a new domain becomes a backend-only change — no frontend deploy, and no
 * 422 from a stale dropdown option the user can still see.
 */
export const constants = asyncHandler(async (_req, res) => {
  res.status(HTTP.OK).json(
    ApiResponse.ok(
      {
        domains: DOMAINS,
        difficulties: DIFFICULTIES,
        projectTypes: PROJECT_TYPES,
        roles: ROLE_LIST,
        artifactTypes: ARTIFACT_TYPE_LIST,
        artifactGroups: ARTIFACT_GROUPS,
        implementedModules: getImplementedTypes(),
        taskCategories: TASK_CATEGORY,
        taskPriorities: TASK_PRIORITY,
      },
      'Constants fetched successfully'
    )
  );
});
