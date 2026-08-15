import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/vivaPrep.prompt.js';

/**
 * The widest context window of any generator — good defense questions have to
 * reference real entities, endpoints and decisions, not generic CS trivia.
 */
class VivaPrepGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.VIVA_PREP,
      dependsOn: [
        ARTIFACT_TYPES.OVERVIEW,
        ARTIFACT_TYPES.SRS,
        ARTIFACT_TYPES.DATABASE_DESIGN,
        ARTIFACT_TYPES.TECH_STACK,
      ],
      prompt,
    });
  }
}

export default VivaPrepGenerator;
