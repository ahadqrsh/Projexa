import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/overview.prompt.js';

/** Root of the dependency graph — depends only on the raw idea. */
class OverviewGenerator extends BaseGenerator {
  constructor() {
    super({ artifactType: ARTIFACT_TYPES.OVERVIEW, dependsOn: [], prompt });
  }
}

export default OverviewGenerator;
