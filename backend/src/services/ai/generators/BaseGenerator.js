/**
 * Template Method.
 *
 * The ALGORITHM for generating any artifact is fixed here and never duplicated:
 *
 *   build context -> build prompt -> call provider -> parse -> validate
 *                 -> persist (with version history) -> log usage -> charge credit
 *
 * A concrete generator supplies only three things: its artifactType, its
 * dependsOn list, and its prompt module. That is why adding module 17 is one
 * small file rather than a copy of 150 lines of orchestration.
 */

import ApiError from '../../../utils/ApiError.js';
import logger from '../../../config/logger.js';
import { artifactRepository } from '../../../repositories/artifact.repository.js';
import { projectRepository } from '../../../repositories/project.repository.js';
import { aiUsageLogRepository } from '../../../repositories/aiUsageLog.repository.js';
import { userRepository } from '../../../repositories/user.repository.js';
import { getAIProvider } from '../providers/providerFactory.js';
import { parseAndValidate } from '../ResponseParser.js';
import { buildContext, buildProjectContext } from '../ContextBuilder.js';
import { BASE_PERSONA } from '../prompts/system/basePersona.js';
import { estimateCostUsd } from '../../../utils/cost.util.js';
import { GENERATION_STATUS } from '../../../../../shared/constants/statuses.js';

class BaseGenerator {
  /**
   * @param {object} config
   * @param {string} config.artifactType  Enum from shared/constants/artifactTypes.js
   * @param {string[]} config.dependsOn   Upstream artifact types injected into the prompt
   * @param {object} config.prompt        { version, outputSchema, buildPrompt }
   */
  constructor({ artifactType, dependsOn = [], prompt }) {
    if (new.target === BaseGenerator) {
      throw new Error('BaseGenerator is abstract');
    }
    if (!artifactType) throw new Error('A generator must declare an artifactType');
    if (!prompt?.buildPrompt) throw new Error(`${artifactType} generator is missing a prompt module`);

    this.artifactType = artifactType;
    this.dependsOn = dependsOn;
    this.prompt = prompt;
  }

  /** Fixed algorithm. Subclasses must not override this. */
  async run({ project, user, jobId }) {
    const startedAt = Date.now();
    const provider = getAIProvider();

    const artifact = await artifactRepository.upsertQueued(project._id, this.artifactType, jobId);
    artifact.status = GENERATION_STATUS.GENERATING;
    await artifact.save();

    try {
      const context = await buildContext(project._id, this.dependsOn);
      const promptText = this.prompt.buildPrompt(buildProjectContext(project), context);

      const response = await provider.generate(promptText, {
        json: true,
        systemInstruction: BASE_PERSONA,
        artifactType: this.artifactType, // consumed by MockProvider
        project,
      });

      const content = parseAndValidate(response.text, this.prompt.outputSchema, {
        artifactType: this.artifactType,
      });

      // Preserve the previous output BEFORE overwriting — this is the undo path.
      if (artifact.content) artifact.archiveCurrentVersion();

      const latencyMs = Date.now() - startedAt;

      artifact.content = content;
      artifact.status = GENERATION_STATUS.COMPLETED;
      artifact.version = artifact.content ? artifact.version + (artifact.previousVersions.length ? 1 : 0) : 1;
      artifact.isStale = false;
      artifact.isManuallyEdited = false;
      artifact.promptVersion = this.prompt.version;
      artifact.model = response.model;
      artifact.provider = provider.name;
      artifact.generatedAt = new Date();
      artifact.error = undefined;
      artifact.generationMeta = {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        latencyMs,
        attempts: response.attempts ?? 1,
      };
      await artifact.save();

      await Promise.all([
        projectRepository.addGeneratedModule(project._id, this.artifactType),
        userRepository.incrementCredits(user._id, 1),
        aiUsageLogRepository.create({
          user: user._id,
          project: project._id,
          artifact: artifact._id,
          module: this.artifactType,
          provider: provider.name,
          model: response.model,
          promptVersion: this.prompt.version,
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.promptTokens + response.usage.completionTokens,
          estimatedCostUsd: estimateCostUsd(
            response.model,
            response.usage.promptTokens,
            response.usage.completionTokens
          ),
          latencyMs,
          status: 'success',
          attempts: response.attempts ?? 1,
          jobId,
        }),
      ]);

      logger.info(`Generated ${this.artifactType} for project ${project._id} in ${latencyMs}ms`);
      return { type: this.artifactType, status: GENERATION_STATUS.COMPLETED, artifact };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;

      /**
       * A failed module marks ONLY itself failed. The batch continues, and the
       * user gets a retry button on one card instead of losing 15 successful
       * generations — and the credits already spent on them.
       */
      artifact.status = GENERATION_STATUS.FAILED;
      artifact.error = {
        message: error instanceof ApiError ? error.message : 'Generation failed unexpectedly',
        code: error.code ?? 'GENERATION_ERROR',
        occurredAt: new Date(),
      };
      await artifact.save();

      await aiUsageLogRepository.create({
        user: user._id,
        project: project._id,
        module: this.artifactType,
        provider: provider.name,
        model: provider.model,
        promptVersion: this.prompt.version,
        latencyMs,
        status: 'failed',
        errorMessage: error.message,
        jobId,
      });

      logger.error(`Generation failed for ${this.artifactType}: ${error.message}`);
      return { type: this.artifactType, status: GENERATION_STATUS.FAILED, error: error.message };
    }
  }
}

export default BaseGenerator;
export { BaseGenerator };
