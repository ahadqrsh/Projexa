import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as artifactService from '../services/artifact.service.js';
import { HTTP } from '../config/constants.js';

export const listArtifacts = asyncHandler(async (req, res) => {
  const artifacts = await artifactService.listArtifacts(req.project._id, {
    fields: req.query.fields?.split(',').join(' '),
  });
  res.status(HTTP.OK).json(ApiResponse.ok({ artifacts }, 'Artifacts fetched successfully'));
});

export const getArtifact = asyncHandler(async (req, res) => {
  const artifact = await artifactService.getArtifact(req.project._id, req.params.type);
  res.status(HTTP.OK).json(ApiResponse.ok({ artifact }, 'Artifact fetched successfully'));
});

export const updateArtifact = asyncHandler(async (req, res) => {
  const artifact = await artifactService.updateArtifact(
    req.project._id,
    req.params.type,
    req.body.content
  );
  res.status(HTTP.OK).json(ApiResponse.ok({ artifact }, 'Artifact updated successfully'));
});

export const deleteArtifact = asyncHandler(async (req, res) => {
  await artifactService.deleteArtifact(req.project._id, req.params.type);
  res.status(HTTP.NO_CONTENT).send();
});

export const listVersions = asyncHandler(async (req, res) => {
  const versions = await artifactService.listVersions(req.project._id, req.params.type);
  res.status(HTTP.OK).json(ApiResponse.ok(versions, 'Version history fetched'));
});

export const restoreVersion = asyncHandler(async (req, res) => {
  const artifact = await artifactService.restoreVersion(
    req.project._id,
    req.params.type,
    req.params.version
  );
  res
    .status(HTTP.OK)
    .json(ApiResponse.ok({ artifact }, `Restored version ${req.params.version}`));
});
