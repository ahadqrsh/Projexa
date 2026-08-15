import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/riskAnalysis.prompt.js';

/** Depends on OVERVIEW, SRS and TECH_STACK so risks are grounded in what was actually agreed. */
class RiskAnalysisGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.RISK_ANALYSIS,
      dependsOn: [ARTIFACT_TYPES.OVERVIEW, ARTIFACT_TYPES.SRS, ARTIFACT_TYPES.TECH_STACK],
      prompt,
    });
  }
}

export default RiskAnalysisGenerator;
