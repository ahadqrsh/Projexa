import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/documentation.prompt.js';

/** Pulls from every upstream design artifact so the README stays consistent with what was actually planned. */
class DocumentationGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.DOCUMENTATION,
      dependsOn: [
        ARTIFACT_TYPES.OVERVIEW,
        ARTIFACT_TYPES.TECH_STACK,
        ARTIFACT_TYPES.FOLDER_STRUCTURE,
        ARTIFACT_TYPES.API_DESIGN,
      ],
      prompt,
    });
  }
}

export default DocumentationGenerator;
