import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/githubGuide.prompt.js';

/** Depends on FOLDER_STRUCTURE and TECH_STACK so the workflow guide matches the real repo layout. */
class GithubGuideGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.GITHUB_GUIDE,
      dependsOn: [ARTIFACT_TYPES.FOLDER_STRUCTURE, ARTIFACT_TYPES.TECH_STACK],
      prompt,
    });
  }
}

export default GithubGuideGenerator;
