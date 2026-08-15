/**
 * Project business logic — the root aggregate of the whole system.
 */

import ApiError from '../utils/ApiError.js';
import { projectRepository } from '../repositories/project.repository.js';
import { artifactRepository } from '../repositories/artifact.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { getStorage } from './storage/storageFactory.js';
import { sendMentorInviteEmail } from './mail/mail.service.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { computeIdeaHash } from '../utils/hash.util.js';
import { parsePagination, parseSort, parseFields } from '../utils/pagination.util.js';
import { PROJECT_VISIBILITY, PROJECT_STATUS } from '../../../shared/constants/statuses.js';
import { ROLES } from '../../../shared/constants/roles.js';
import { IDEA_HASH_FIELDS } from '../config/constants.js';

/** Whitelist — never spread req.body into a project update. */
const EDITABLE_FIELDS = [
  'title',
  'description',
  'domain',
  'difficulty',
  'teamSize',
  'preferredTech',
  'deadline',
  'aiIntegrationRequired',
  'projectType',
  'tags',
];

const OWNER_PROJECTION =
  'title slug description domain difficulty teamSize deadline status visibility ' +
  'coverImage tags generatedModules completionPercentage lastGeneratedAt createdAt updatedAt';

export const createProject = async (ownerId, payload) => {
  const project = await projectRepository.create({ ...payload, owner: ownerId });
  return project;
};

export const listProjects = async (ownerId, query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = { owner: ownerId };
  if (query.status) filter.status = query.status;
  if (query.domain) filter.domain = query.domain;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.search) filter.$text = { $search: query.search };

  return projectRepository.paginate(filter, {
    page,
    limit,
    skip,
    sort: parseSort(query.sort ?? '-updatedAt'),
    select: parseFields(query.fields) ?? OWNER_PROJECTION,
  });
};

export const listPublicProjects = async (query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = { visibility: PROJECT_VISIBILITY.PUBLIC };
  if (query.domain) filter.domain = query.domain;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.search) filter.$text = { $search: query.search };

  return projectRepository.paginate(filter, {
    page,
    limit,
    skip,
    sort: parseSort(query.sort ?? '-viewCount'),
    select: OWNER_PROJECTION,
    populate: { path: 'owner', select: 'name avatar college' },
  });
};

export const listBookmarked = async (userId, query) => {
  const { page, limit, skip } = parsePagination(query);
  return projectRepository.paginate(
    { bookmarkedBy: userId },
    {
      page,
      limit,
      skip,
      sort: parseSort(query.sort ?? '-updatedAt'),
      select: OWNER_PROJECTION,
      populate: { path: 'owner', select: 'name avatar' },
    }
  );
};

export const listAssignedToMentor = async (mentorId, query) => {
  const { page, limit, skip } = parsePagination(query);
  return projectRepository.paginate(
    { mentors: mentorId },
    {
      page,
      limit,
      skip,
      sort: parseSort(query.sort ?? '-updatedAt'),
      select: OWNER_PROJECTION,
      populate: { path: 'owner', select: 'name email avatar college' },
    }
  );
};

/**
 * Detail view returns a per-module status summary alongside the project so the
 * workspace grid renders in ONE request instead of 16.
 */
export const getProjectDetail = async (project) => {
  const artifacts = await artifactRepository.findAllForProject(project._id, {
    select: 'type status version isStale isManuallyEdited generatedAt error',
  });

  const populated = await project.populate([
    { path: 'owner', select: 'name email avatar college' },
    { path: 'mentors', select: 'name email avatar' },
  ]);

  return { project: populated, artifacts };
};

const titleCase = (v = '') => String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Project history, DERIVED from timestamps already recorded on the project and
 * its artifacts — deliberately not a separate activity-log collection. A write-time
 * log needs a hook at every mutation site (easy to forget one); reading the
 * existing generatedAt / version / previousVersions / updatedAt fields at request
 * time can never drift out of sync with what actually happened, because it IS
 * what happened.
 */
export const getProjectHistory = async (project) => {
  const artifacts = await artifactRepository.findAllForProject(project._id);

  const events = [
    {
      type: 'project_created',
      label: 'Project created',
      timestamp: project.createdAt,
    },
  ];

  if (project.updatedAt && project.updatedAt.getTime() - project.createdAt.getTime() > 5000) {
    events.push({
      type: 'project_updated',
      label: 'Project details updated',
      timestamp: project.updatedAt,
    });
  }

  for (const artifact of artifacts) {
    for (const prev of artifact.previousVersions ?? []) {
      events.push({
        type: 'module_version_saved',
        label: `${titleCase(artifact.type)} — version ${prev.version} saved`,
        timestamp: prev.generatedAt,
        module: artifact.type,
        version: prev.version,
      });
    }

    if (artifact.status === 'completed' && artifact.generatedAt) {
      events.push({
        type: artifact.isManuallyEdited ? 'module_edited' : 'module_generated',
        label: `${titleCase(artifact.type)} ${artifact.isManuallyEdited ? 'manually edited' : 'generated'} — version ${artifact.version}`,
        timestamp: artifact.generatedAt,
        module: artifact.type,
        version: artifact.version,
      });
    }

    if (artifact.status === 'failed' && artifact.error?.occurredAt) {
      events.push({
        type: 'module_failed',
        label: `${titleCase(artifact.type)} generation failed`,
        timestamp: artifact.error.occurredAt,
        module: artifact.type,
        error: artifact.error.message,
      });
    }
  }

  return events
    .filter((e) => e.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * Update, with staleness detection.
 *
 * If any idea-defining field changed, the ideaHash changes, and every completed
 * artifact is flagged isStale — never deleted. The student keeps their existing
 * SRS while deciding whether to regenerate, which matters most the night before
 * a submission deadline.
 */
export const updateProject = async (project, payload) => {
  const previousHash = project.ideaHash;

  for (const field of EDITABLE_FIELDS) {
    if (payload[field] !== undefined) project[field] = payload[field];
  }

  const nextHash = computeIdeaHash(project.toObject());
  const ideaChanged = previousHash !== nextHash;

  await project.save();

  let staleArtifactCount = 0;
  if (ideaChanged) {
    const result = await artifactRepository.markStaleForProject(project._id);
    staleArtifactCount = result.modifiedCount ?? 0;
  }

  return { project, ideaChanged, staleArtifactCount, changedFields: IDEA_HASH_FIELDS };
};

export const updateVisibility = async (project, visibility) => {
  project.visibility = visibility;
  await project.save();
  return project;
};

export const updateStatus = async (project, status) => {
  project.status = status;
  await project.save();
  return project;
};

export const updateCover = async (project, file) => {
  if (!file) throw ApiError.badRequest('No image file was provided');

  const storage = getStorage();
  const uploaded = await storage.upload(file.buffer, {
    folder: 'covers',
    publicId: `project_${project._id}`,
    transformation: [
      { width: 1200, height: 630, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  if (project.coverImage?.publicId && project.coverImage.publicId !== uploaded.publicId) {
    await storage.destroy(project.coverImage.publicId);
  }

  project.coverImage = { url: uploaded.url, publicId: uploaded.publicId };
  await project.save();
  return project;
};

/** Soft delete with a 30-day restore window — students delete by accident. */
export const deleteProject = async (project) => {
  await projectRepository.softDelete(project._id);
};

export const restoreProject = async (projectId, userId) => {
  const project = await projectRepository
    .findById(projectId, { options: { includeDeleted: true } })
    .setOptions({ includeDeleted: true });

  if (!project) throw ApiError.notFound('Project');
  if (String(project.owner) !== String(userId)) {
    throw ApiError.forbidden('Only the owner can restore this project');
  }
  if (!project.isDeleted) throw ApiError.badRequest('This project is not deleted');

  return projectRepository.restore(projectId);
};

/**
 * Duplicate copies the IDEA only, never the artifacts.
 * Copying generated content would produce documents whose ideaHash no longer
 * matches their parent — silently stale from birth, with no way for the UI to know.
 */
export const duplicateProject = async (project, ownerId) => {
  const source = project.toObject();
  const copy = {};
  for (const field of EDITABLE_FIELDS) copy[field] = source[field];

  return projectRepository.create({
    ...copy,
    title: `${source.title} (copy)`.slice(0, 120),
    owner: ownerId,
    slug: undefined,
    status: PROJECT_STATUS.DRAFT,
    visibility: PROJECT_VISIBILITY.PRIVATE,
    generatedModules: [],
    completionPercentage: 0,
    coverImage: { url: null, publicId: null },
  });
};

export const toggleBookmark = async (projectId, userId) => {
  const project = await projectRepository.findById(projectId);
  if (!project) throw ApiError.notFound('Project');

  const alreadyBookmarked = project.bookmarkedBy.some((id) => String(id) === String(userId));
  const updated = await projectRepository.toggleBookmark(projectId, userId, !alreadyBookmarked);

  return { bookmarked: !alreadyBookmarked, bookmarkCount: updated.bookmarkedBy.length };
};

export const addMentor = async (project, email, actingUser) => {
  const mentor = await userRepository.findByEmail(email);
  if (!mentor) {
    throw ApiError.notFound(`No account found for ${email}. Ask them to sign up first`);
  }
  if (String(mentor._id) === String(project.owner)) {
    throw ApiError.badRequest('You cannot add yourself as a mentor');
  }
  if (mentor.role === ROLES.STUDENT) {
    throw ApiError.badRequest('That account is not registered as a mentor');
  }
  if (project.mentors.some((m) => String(m) === String(mentor._id))) {
    throw ApiError.conflict('That mentor is already assigned to this project');
  }

  project.mentors.push(mentor._id);
  await project.save();

  await notificationRepository.create({
    user: mentor._id,
    type: 'mentor_invite',
    title: 'You have been invited to mentor a project',
    message: `${actingUser.name} invited you to review "${project.title}"`,
    link: `/mentor/projects/${project._id}`,
    metadata: { projectId: project._id },
  });

  await sendMentorInviteEmail({
    to: mentor.email,
    mentorName: mentor.name,
    studentName: actingUser.name,
    projectTitle: project.title,
    projectId: project._id,
  });

  return project.populate({ path: 'mentors', select: 'name email avatar' });
};

export const removeMentor = async (project, mentorId) => {
  project.mentors = project.mentors.filter((m) => String(m) !== String(mentorId));
  await project.save();
  return project;
};

export const getStats = async (userId) => {
  const [projectStats, user] = await Promise.all([
    projectRepository.statsForOwner(userId),
    userRepository.findById(userId),
  ]);

  return {
    projects: {
      total: projectStats.total,
      active: projectStats.active,
      completed: projectStats.completed,
      averageCompletion: Math.round(projectStats.avgCompletion ?? 0),
    },
    modules: { generated: projectStats.totalModules },
    credits: {
      used: user.aiCredits.used,
      limit: user.aiCredits.limit,
      remaining: Math.max(user.aiCredits.limit - user.aiCredits.used, 0),
      resetAt: user.aiCredits.resetAt,
    },
  };
};

export const getPublicProject = async (project) => {
  await projectRepository.incrementViewCount(project._id);
  return getProjectDetail(project);
};

export default {
  createProject,
  listProjects,
  listPublicProjects,
  listBookmarked,
  listAssignedToMentor,
  getProjectDetail,
  getProjectHistory,
  updateProject,
  updateVisibility,
  updateStatus,
  updateCover,
  deleteProject,
  restoreProject,
  duplicateProject,
  toggleBookmark,
  addMentor,
  removeMentor,
  getStats,
  getPublicProject,
};
