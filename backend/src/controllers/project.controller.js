import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as projectService from '../services/project.service.js';
import { HTTP } from '../config/constants.js';

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);
  res.status(HTTP.CREATED).json(ApiResponse.created({ project }, 'Project created successfully'));
});

export const listProjects = asyncHandler(async (req, res) => {
  const { items, meta } = await projectService.listProjects(req.user._id, req.query);
  res
    .status(HTTP.OK)
    .json(ApiResponse.ok({ projects: items }, 'Projects fetched successfully', meta));
});

export const listPublicProjects = asyncHandler(async (req, res) => {
  const { items, meta } = await projectService.listPublicProjects(req.query);
  res
    .status(HTTP.OK)
    .json(ApiResponse.ok({ projects: items }, 'Public projects fetched successfully', meta));
});

export const listBookmarks = asyncHandler(async (req, res) => {
  const { items, meta } = await projectService.listBookmarked(req.user._id, req.query);
  res.status(HTTP.OK).json(ApiResponse.ok({ projects: items }, 'Bookmarks fetched', meta));
});

export const listAssigned = asyncHandler(async (req, res) => {
  const { items, meta } = await projectService.listAssignedToMentor(req.user._id, req.query);
  res.status(HTTP.OK).json(ApiResponse.ok({ projects: items }, 'Assigned projects fetched', meta));
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await projectService.getStats(req.user._id);
  res.status(HTTP.OK).json(ApiResponse.ok(stats, 'Statistics fetched successfully'));
});

// req.project is loaded and access-checked by requireProjectAccess — no re-query here.
export const getProject = asyncHandler(async (req, res) => {
  const data = await projectService.getProjectDetail(req.project);
  res.status(HTTP.OK).json(ApiResponse.ok(data, 'Project fetched successfully'));
});

export const getProjectHistory = asyncHandler(async (req, res) => {
  const events = await projectService.getProjectHistory(req.project);
  res.status(HTTP.OK).json(ApiResponse.ok({ events }, 'History fetched successfully'));
});

export const getProjectBySlug = asyncHandler(async (req, res) => {
  const data = await projectService.getPublicProject(req.project);
  res.status(HTTP.OK).json(ApiResponse.ok(data, 'Project fetched successfully'));
});

export const updateProject = asyncHandler(async (req, res) => {
  const { project, ideaChanged, staleArtifactCount } = await projectService.updateProject(
    req.project,
    req.body
  );

  const message = ideaChanged
    ? `Project updated. ${staleArtifactCount} module(s) are now out of date.`
    : 'Project updated successfully';

  res.status(HTTP.OK).json(ApiResponse.ok({ project, ideaChanged, staleArtifactCount }, message));
});

export const updateVisibility = asyncHandler(async (req, res) => {
  const project = await projectService.updateVisibility(req.project, req.body.visibility);
  res.status(HTTP.OK).json(ApiResponse.ok({ project }, 'Visibility updated'));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const project = await projectService.updateStatus(req.project, req.body.status);
  res.status(HTTP.OK).json(ApiResponse.ok({ project }, 'Status updated'));
});

export const updateCover = asyncHandler(async (req, res) => {
  const project = await projectService.updateCover(req.project, req.file);
  res.status(HTTP.OK).json(ApiResponse.ok({ project }, 'Cover image updated'));
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.project);
  res.status(HTTP.NO_CONTENT).send();
});

export const restoreProject = asyncHandler(async (req, res) => {
  const project = await projectService.restoreProject(req.params.id, req.user._id);
  res.status(HTTP.OK).json(ApiResponse.ok({ project }, 'Project restored successfully'));
});

export const duplicateProject = asyncHandler(async (req, res) => {
  const project = await projectService.duplicateProject(req.project, req.user._id);
  res.status(HTTP.CREATED).json(ApiResponse.created({ project }, 'Project duplicated'));
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const result = await projectService.toggleBookmark(req.params.id, req.user._id);
  res
    .status(HTTP.OK)
    .json(ApiResponse.ok(result, result.bookmarked ? 'Bookmark added' : 'Bookmark removed'));
});

export const addMentor = asyncHandler(async (req, res) => {
  const project = await projectService.addMentor(req.project, req.body.email, req.user);
  res.status(HTTP.OK).json(ApiResponse.ok({ project }, 'Mentor invited successfully'));
});

export const removeMentor = asyncHandler(async (req, res) => {
  const project = await projectService.removeMentor(req.project, req.params.userId);
  res.status(HTTP.OK).json(ApiResponse.ok({ project }, 'Mentor removed'));
});
