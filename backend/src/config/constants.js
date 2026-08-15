/** HTTP status codes used across the app. Named constants beat magic numbers. */
export const HTTP = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
});

export const COOKIE_NAMES = Object.freeze({
  REFRESH_TOKEN: 'refreshToken',
});

export const MAX_ARTIFACT_VERSIONS = 5;

/** Fields that participate in the idea hash (Doc 03 section 3). */
export const IDEA_HASH_FIELDS = Object.freeze([
  'title',
  'description',
  'domain',
  'difficulty',
  'teamSize',
  'preferredTech',
  'aiIntegrationRequired',
  'projectType',
]);
