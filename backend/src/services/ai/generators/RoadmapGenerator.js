import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/roadmap.prompt.js';

/** Depends on FEATURES so every high-priority feature is actually scheduled. */
class RoadmapGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.ROADMAP,
      dependsOn: [ARTIFACT_TYPES.OVERVIEW, ARTIFACT_TYPES.FEATURES],
      prompt,
    });
  }
}

export default RoadmapGenerator;
