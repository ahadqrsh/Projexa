import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/srs.prompt.js';

class SrsGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.SRS,
      dependsOn: [ARTIFACT_TYPES.OVERVIEW, ARTIFACT_TYPES.FEATURES],
      prompt,
    });
  }
}

export default SrsGenerator;
