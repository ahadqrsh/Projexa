export const PROJECT_STATUS = Object.freeze({
  DRAFT: 'draft',
  GENERATING: 'generating',
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
});

export const PROJECT_VISIBILITY = Object.freeze({
  PRIVATE: 'private',
  UNLISTED: 'unlisted',
  PUBLIC: 'public',
});

export const GENERATION_STATUS = Object.freeze({
  QUEUED: 'queued',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

export const JOB_STATUS = Object.freeze({
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
});

export const TASK_STATUS = Object.freeze({
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
});

export const TASK_CATEGORY = Object.freeze([
  'setup',
  'backend',
  'frontend',
  'database',
  'ai',
  'testing',
  'deployment',
  'documentation',
  'design',
]);

export const TASK_PRIORITY = Object.freeze(['low', 'medium', 'high', 'critical']);

export const SPRINT_STATUS = Object.freeze({
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
});

export const REPORT_STATUS = Object.freeze({
  QUEUED: 'queued',
  BUILDING: 'building',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

export const NOTIFICATION_TYPES = Object.freeze([
  'generation_completed',
  'generation_failed',
  'report_ready',
  'mentor_comment',
  'mention',
  'mentor_invite',
  'task_due',
  'quota_warning',
  'system',
]);
