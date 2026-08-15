import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/deploymentGuide.prompt.js';

/** Depends on TECH_STACK (what to deploy) and FOLDER_STRUCTURE (where things live). */
class DeploymentGuideGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.DEPLOYMENT_GUIDE,
      dependsOn: [ARTIFACT_TYPES.TECH_STACK, ARTIFACT_TYPES.FOLDER_STRUCTURE],
      prompt,
    });
  }
}

export default DeploymentGuideGenerator;
