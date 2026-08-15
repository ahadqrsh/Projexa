import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/features.prompt.js';

class FeaturesGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.FEATURES,
      dependsOn: [ARTIFACT_TYPES.OVERVIEW],
      prompt,
    });
  }
}

export default FeaturesGenerator;
