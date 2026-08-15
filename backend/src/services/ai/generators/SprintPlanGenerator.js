import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/sprintPlan.prompt.js';

/** Depends on ROADMAP (converts the weekly plan into sprints) and FEATURES (backlog items). */
class SprintPlanGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.SPRINT_PLAN,
      dependsOn: [ARTIFACT_TYPES.ROADMAP, ARTIFACT_TYPES.FEATURES],
      prompt,
    });
  }
}

export default SprintPlanGenerator;
