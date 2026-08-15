import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/costEstimation.prompt.js';

/** Depends on TECH_STACK (what to price) and ROADMAP (how long it runs). */
class CostEstimationGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.COST_ESTIMATION,
      dependsOn: [ARTIFACT_TYPES.TECH_STACK, ARTIFACT_TYPES.ROADMAP],
      prompt,
    });
  }
}

export default CostEstimationGenerator;
