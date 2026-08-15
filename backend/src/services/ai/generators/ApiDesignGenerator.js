import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/apiDesign.prompt.js';

/**
 * Depends on DATABASE_DESIGN so the generated endpoints operate on the collections
 * that were actually designed — without that context the AI invents a second,
 * contradictory data model.
 */
class ApiDesignGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.API_DESIGN,
      dependsOn: [ARTIFACT_TYPES.DATABASE_DESIGN, ARTIFACT_TYPES.SRS],
      prompt,
    });
  }
}

export default ApiDesignGenerator;
