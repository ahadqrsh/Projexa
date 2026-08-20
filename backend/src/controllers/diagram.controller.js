import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as diagramService from '../services/diagram.service.js';
import { HTTP } from '../config/constants.js';

export const listDiagrams = asyncHandler(async (req, res) => {
  const diagrams = await diagramService.listDiagrams(req.project._id);
  res.status(HTTP.OK).json(ApiResponse.ok({ diagrams }, 'Diagrams fetched successfully'));
});

export const getDiagram = asyncHandler(async (req, res) => {
  const diagram = await diagramService.getDiagram(req.project._id, req.params.type);
  res.status(HTTP.OK).json(ApiResponse.ok({ diagram }, 'Diagram fetched successfully'));
});

/** 202, same convention as generation: the AI call has not completed when this returns... */
export const generateDiagram = asyncHandler(async (req, res) => {
  const diagram = await diagramService.generateDiagram({
    project: req.project,
    user: req.user,
    type: req.params.type,
  });
  // ...except here it HAS completed — this is a synchronous, single-item call,
  // so 200 with the finished diagram is correct rather than 202 + polling.
  res.status(HTTP.OK).json(ApiResponse.ok({ diagram }, 'Diagram generated successfully'));
});

export const updateDiagram = asyncHandler(async (req, res) => {
  const diagram = await diagramService.updateDiagramSource({
    projectId: req.project._id,
    type: req.params.type,
    source: req.body.source,
    title: req.body.title,
  });
  res.status(HTTP.OK).json(ApiResponse.ok({ diagram }, 'Diagram updated successfully'));
});
