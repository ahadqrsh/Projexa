import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'riskAnalysis@1.0';

export const outputSchema = z.object({
  risks: z
    .array(
      z.object({
        title: z.string().min(3),
        category: z.enum(['technical', 'schedule', 'resource', 'scope', 'external']),
        likelihood: z.enum(['low', 'medium', 'high']),
        impact: z.enum(['low', 'medium', 'high']),
        mitigation: z.string().min(15),
      })
    )
    .min(4)
    .max(15),
});

export const buildPrompt = (project, context = {}) => `Identify project risks and mitigations for this student project.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Difficulty: ${project.difficulty}
Team size: ${project.teamSize}

${context.OVERVIEW ? `OVERVIEW\n${JSON.stringify(context.OVERVIEW)}\n` : ''}
${context.SRS ? `SRS\n${JSON.stringify(context.SRS)}\n` : ''}
${context.TECH_STACK ? `TECH STACK\n${JSON.stringify(context.TECH_STACK)}` : ''}

Guidance:
- Cover a mix of categories — do not make every risk "technical".
- Risks must be specific to THIS project (its stack, scope, and team size), not generic boilerplate like "requirements may change".
- Every mitigation must be an action the team can actually take, not just "monitor closely".
${buildOutputContract(`{
  "risks": [
    {
      "title": "risk title",
      "category": "technical | schedule | resource | scope | external",
      "likelihood": "low | medium | high",
      "impact": "low | medium | high",
      "mitigation": "concrete action to reduce or handle this risk"
    }
  ]
}`)}`;

export default { version, outputSchema, buildPrompt };
