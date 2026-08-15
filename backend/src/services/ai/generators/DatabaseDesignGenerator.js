import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/databaseDesign.prompt.js';

class DatabaseDesignGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.DATABASE_DESIGN,
      dependsOn: [ARTIFACT_TYPES.FEATURES, ARTIFACT_TYPES.SRS],
      prompt,
    });
  }
}

export default DatabaseDesignGenerator;
