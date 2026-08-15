import OverviewRenderer from './OverviewRenderer';
import FeaturesRenderer from './FeaturesRenderer';
import TechStackRenderer from './TechStackRenderer';
import SrsRenderer from './SrsRenderer';
import DatabaseDesignRenderer from './DatabaseDesignRenderer';
import ApiDesignRenderer from './ApiDesignRenderer';
import FolderStructureRenderer from './FolderStructureRenderer';
import RoadmapRenderer from './RoadmapRenderer';
import VivaPrepRenderer from './VivaPrepRenderer';
import UiPlanRenderer from './UiPlanRenderer';
import SprintPlanRenderer from './SprintPlanRenderer';
import DocumentationRenderer from './DocumentationRenderer';
import CostEstimationRenderer from './CostEstimationRenderer';
import RiskAnalysisRenderer from './RiskAnalysisRenderer';
import GithubGuideRenderer from './GithubGuideRenderer';
import DeploymentGuideRenderer from './DeploymentGuideRenderer';
import JsonFallbackRenderer from './JsonFallbackRenderer';

/**
 * artifactType -> renderer component. Mirrors GeneratorRegistry.js on the
 * backend on purpose: adding a module there and forgetting to add its
 * renderer here is a real failure mode, so anything missing falls back to
 * JsonFallbackRenderer rather than crashing the page.
 */
const renderers = {
  OVERVIEW: OverviewRenderer,
  FEATURES: FeaturesRenderer,
  TECH_STACK: TechStackRenderer,
  SRS: SrsRenderer,
  DATABASE_DESIGN: DatabaseDesignRenderer,
  API_DESIGN: ApiDesignRenderer,
  FOLDER_STRUCTURE: FolderStructureRenderer,
  ROADMAP: RoadmapRenderer,
  VIVA_PREP: VivaPrepRenderer,
  UI_PLAN: UiPlanRenderer,
  SPRINT_PLAN: SprintPlanRenderer,
  DOCUMENTATION: DocumentationRenderer,
  COST_ESTIMATION: CostEstimationRenderer,
  RISK_ANALYSIS: RiskAnalysisRenderer,
  GITHUB_GUIDE: GithubGuideRenderer,
  DEPLOYMENT_GUIDE: DeploymentGuideRenderer,
};

export const getRenderer = (type) => renderers[type] ?? JsonFallbackRenderer;

export default renderers;
