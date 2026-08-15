import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/uiPlan.prompt.js';

/** Depends on FEATURES (screens must cover every role) and TECH_STACK (component library choice). */
class UiPlanGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.UI_PLAN,
      dependsOn: [ARTIFACT_TYPES.FEATURES, ARTIFACT_TYPES.TECH_STACK],
      prompt,
    });
  }
}

export default UiPlanGenerator;
