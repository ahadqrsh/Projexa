import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/techStack.prompt.js';

class TechStackGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.TECH_STACK,
      dependsOn: [ARTIFACT_TYPES.OVERVIEW],
      prompt,
    });
  }
}

export default TechStackGenerator;
