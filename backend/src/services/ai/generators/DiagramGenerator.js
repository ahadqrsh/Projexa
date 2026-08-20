/**
 * Diagram generation, parallel to BaseGenerator but deliberately NOT sharing
 * its class hierarchy: diagrams persist to the Diagram model (source +
 * engine, no previousVersions archive) rather than Artifact, and there is
 * only one algorithm needed for all 5 diagram types — the differences are
 * entirely data (dependsOn, cheatsheet) already captured in DIAGRAM_META.
 * One parameterized instance per type, same as the 16 artifact generators,
 * without duplicating this ~80-line orchestration 5 times.
 */

import ApiError from '../../../utils/ApiError.js';
import logger from '../../../config/logger.js';
import { diagramRepository } from '../../../repositories/diagram.repository.js';
import { userRepository } from '../../../repositories/user.repository.js';
import { aiUsageLogRepository } from '../../../repositories/aiUsageLog.repository.js';
import { getAIProvider } from '../providers/providerFactory.js';
import { parseAndValidate } from '../ResponseParser.js';
import { buildContext, buildProjectContext } from '../ContextBuilder.js';
import { BASE_PERSONA } from '../prompts/system/basePersona.js';
import { estimateCostUsd } from '../../../utils/cost.util.js';
import { GENERATION_STATUS } from '../../../../../shared/constants/statuses.js';
import diagramPrompt, { DIAGRAM_META } from '../prompts/diagrams/diagram.prompt.js';
import { DIAGRAM_TYPE_LIST } from '../../../../../shared/constants/artifactTypes.js';

class DiagramGenerator {
  constructor(diagramType) {
    const meta = DIAGRAM_META[diagramType];
    if (!meta) throw new Error(`Unknown diagram type: ${diagramType}`);
    this.diagramType = diagramType;
    this.dependsOn = meta.dependsOn;
    this.label = meta.label;
  }

  async run({ project, user }) {
    const startedAt = Date.now();
    const provider = getAIProvider();

    const diagram = await diagramRepository.upsertQueued(project._id, this.diagramType);
    diagram.status = GENERATION_STATUS.GENERATING;
    await diagram.save();

    try {
      const context = await buildContext(project._id, this.dependsOn);
      const promptText = diagramPrompt.buildPrompt(this.diagramType, buildProjectContext(project), context);

      const response = await provider.generate(promptText, {
        json: true,
        systemInstruction: BASE_PERSONA,
        artifactType: this.diagramType, // consumed by MockProvider's fixture lookup
        project,
      });

      const content = parseAndValidate(response.text, diagramPrompt.outputSchema, {
        artifactType: this.diagramType,
      });

      const latencyMs = Date.now() - startedAt;

      diagram.title = content.title;
      diagram.source = content.mermaid;
      diagram.status = GENERATION_STATUS.COMPLETED;
      diagram.version = diagram.version + (diagram.generatedAt ? 1 : 0);
      diagram.isStale = false;
      diagram.isManuallyEdited = false;
      diagram.generatedAt = new Date();
      diagram.error = undefined;
      // Rendered binary is produced lazily client-side; we never populate
      // `rendered` here — that is the entire point of not running a headless
      // browser on the server for every diagram generation.
      await diagram.save();

      await Promise.all([
        userRepository.incrementCredits(user._id, 1),
        aiUsageLogRepository.create({
          user: user._id,
          project: project._id,
          module: this.diagramType,
          provider: provider.name,
          model: response.model,
          promptVersion: diagramPrompt.version,
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
        }),
      ]);

      logger.info(`Generated diagram ${this.diagramType} for project ${project._id} in ${latencyMs}ms`);
      return { type: this.diagramType, status: GENERATION_STATUS.COMPLETED, diagram };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;

      diagram.status = GENERATION_STATUS.FAILED;
      diagram.error = {
        message: error instanceof ApiError ? error.message : 'Generation failed unexpectedly',
        occurredAt: new Date(),
      };
      await diagram.save();

      await aiUsageLogRepository.create({
        user: user._id,
        project: project._id,
        module: this.diagramType,
        provider: provider.name,
        model: provider.model,
        promptVersion: diagramPrompt.version,
        latencyMs,
        status: 'failed',
        errorMessage: error.message,
      });

      logger.error(`Diagram generation failed for ${this.diagramType}: ${error.message}`);
      throw error instanceof ApiError ? error : ApiError.internal('Diagram generation failed unexpectedly');
    }
  }
}

/**
 * One instance per type, built once. Mirrors GeneratorRegistry.js's
 * getGenerator() so the two "which module am I asking for" lookups in this
 * codebase look and behave the same way.
 */
const registry = new Map(DIAGRAM_TYPE_LIST.map((type) => [type, new DiagramGenerator(type)]));

export const getDiagramGenerator = (diagramType) => {
  const generator = registry.get(diagramType);
  if (!generator) {
    throw ApiError.badRequest(
      `"${diagramType}" is not a known diagram type. Available: ${DIAGRAM_TYPE_LIST.join(', ')}`
    );
  }
  return generator;
};

export default DiagramGenerator;
export { DiagramGenerator };
