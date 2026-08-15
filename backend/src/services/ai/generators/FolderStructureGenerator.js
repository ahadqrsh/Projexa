import BaseGenerator from './BaseGenerator.js';
import { ARTIFACT_TYPES } from '../../../../../shared/constants/artifactTypes.js';
import prompt from '../prompts/modules/folderStructure.prompt.js';

/**
 * Depends on TECH_STACK so the tree names real folders for the chosen framework
 * (e.g. app/ for Next.js vs src/ for Vite) rather than a generic guess, and on
 * DATABASE_DESIGN so the backend model/repository file count is plausible.
 */
class FolderStructureGenerator extends BaseGenerator {
  constructor() {
    super({
      artifactType: ARTIFACT_TYPES.FOLDER_STRUCTURE,
      dependsOn: [ARTIFACT_TYPES.TECH_STACK, ARTIFACT_TYPES.DATABASE_DESIGN],
      prompt,
    });
  }
}

export default FolderStructureGenerator;
