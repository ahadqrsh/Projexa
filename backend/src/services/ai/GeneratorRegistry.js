/**
 * artifactType -> generator instance.
 *
 * THIS FILE IS THE OPEN/CLOSED PRINCIPLE IN THE CODEBASE.
 *
 * Adding a new module means:
 *   1. add the enum to shared/constants/artifactTypes.js
 *   2. add prompts/modules/<name>.prompt.js
 *   3. add generators/<Name>Generator.js
 *   4. add ONE line below
 *
 * The queue, the service, the controllers, the routes and the error handling are
 * never touched. There is no switch statement on artifact type anywhere.
 */

import { ARTIFACT_TYPES } from '../../../../shared/constants/artifactTypes.js';
import OverviewGenerator from './generators/OverviewGenerator.js';
import FeaturesGenerator from './generators/FeaturesGenerator.js';
import TechStackGenerator from './generators/TechStackGenerator.js';
import SrsGenerator from './generators/SrsGenerator.js';
import DatabaseDesignGenerator from './generators/DatabaseDesignGenerator.js';
import ApiDesignGenerator from './generators/ApiDesignGenerator.js';
import FolderStructureGenerator from './generators/FolderStructureGenerator.js';
import RoadmapGenerator from './generators/RoadmapGenerator.js';
import VivaPrepGenerator from './generators/VivaPrepGenerator.js';
import UiPlanGenerator from './generators/UiPlanGenerator.js';
import SprintPlanGenerator from './generators/SprintPlanGenerator.js';
import DocumentationGenerator from './generators/DocumentationGenerator.js';
import CostEstimationGenerator from './generators/CostEstimationGenerator.js';
import RiskAnalysisGenerator from './generators/RiskAnalysisGenerator.js';
import GithubGuideGenerator from './generators/GithubGuideGenerator.js';
import DeploymentGuideGenerator from './generators/DeploymentGuideGenerator.js';
import ApiError from '../../utils/ApiError.js';

const registry = new Map([
  [ARTIFACT_TYPES.OVERVIEW, new OverviewGenerator()],
  [ARTIFACT_TYPES.FEATURES, new FeaturesGenerator()],
  [ARTIFACT_TYPES.TECH_STACK, new TechStackGenerator()],
  [ARTIFACT_TYPES.SRS, new SrsGenerator()],
  [ARTIFACT_TYPES.DATABASE_DESIGN, new DatabaseDesignGenerator()],
  [ARTIFACT_TYPES.API_DESIGN, new ApiDesignGenerator()],
  [ARTIFACT_TYPES.FOLDER_STRUCTURE, new FolderStructureGenerator()],
  [ARTIFACT_TYPES.ROADMAP, new RoadmapGenerator()],
  [ARTIFACT_TYPES.VIVA_PREP, new VivaPrepGenerator()],
  [ARTIFACT_TYPES.UI_PLAN, new UiPlanGenerator()],
  [ARTIFACT_TYPES.SPRINT_PLAN, new SprintPlanGenerator()],
  [ARTIFACT_TYPES.DOCUMENTATION, new DocumentationGenerator()],
  [ARTIFACT_TYPES.COST_ESTIMATION, new CostEstimationGenerator()],
  [ARTIFACT_TYPES.RISK_ANALYSIS, new RiskAnalysisGenerator()],
  [ARTIFACT_TYPES.GITHUB_GUIDE, new GithubGuideGenerator()],
  [ARTIFACT_TYPES.DEPLOYMENT_GUIDE, new DeploymentGuideGenerator()],
  // All 16 module types are now implemented.
]);

export const getGenerator = (artifactType) => {
  const generator = registry.get(artifactType);
  if (!generator) {
    throw ApiError.badRequest(
      `The "${artifactType}" module is not available yet. Implemented modules: ${[...registry.keys()].join(', ')}`
    );
  }
  return generator;
};

export const isImplemented = (artifactType) => registry.has(artifactType);

export const getImplementedTypes = () => [...registry.keys()];

/**
 * Topological sort so a module never runs before the artifacts it reads.
 * Kahn's algorithm; unknown or unselected dependencies are simply ignored,
 * because a generator degrades gracefully when its context is absent.
 */
export const sortByDependencies = (types) => {
  const selected = new Set(types.filter(isImplemented));
  const indegree = new Map();
  const dependents = new Map();

  for (const type of selected) {
    const deps = getGenerator(type).dependsOn.filter((d) => selected.has(d));
    indegree.set(type, deps.length);
    for (const dep of deps) {
      if (!dependents.has(dep)) dependents.set(dep, []);
      dependents.get(dep).push(type);
    }
  }

  const queue = [...selected].filter((t) => indegree.get(t) === 0);
  const ordered = [];

  while (queue.length) {
    const current = queue.shift();
    ordered.push(current);
    for (const dependent of dependents.get(current) ?? []) {
      indegree.set(dependent, indegree.get(dependent) - 1);
      if (indegree.get(dependent) === 0) queue.push(dependent);
    }
  }

  // A cycle would leave nodes unvisited. Append them so nothing is silently dropped.
  for (const type of selected) if (!ordered.includes(type)) ordered.push(type);

  return ordered;
};

export default { getGenerator, isImplemented, getImplementedTypes, sortByDependencies };
