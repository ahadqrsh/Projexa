import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'techStack@1.0';

export const outputSchema = z.object({
  frontend: z.array(z.string()).min(1),
  backend: z.array(z.string()).min(1),
  database: z.array(z.string()).min(1),
  aiModels: z.array(z.string()),
  deployment: z.array(z.string()).min(1),
  authentication: z.array(z.string()).min(1),
  rationale: z.string().min(40),
  alternativesConsidered: z.array(z.string()).min(1).max(6),
});

export const buildPrompt = (project, context = {}) => `Recommend a technology stack for this project.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Domain: ${project.domain}
Difficulty: ${project.difficulty}
Team size: ${project.teamSize}
Project type: ${project.projectType}
AI integration required: ${project.aiIntegrationRequired ? 'yes' : 'no'}
${
  project.preferredTech?.length
    ? `Student's preferred technologies: ${project.preferredTech.join(', ')} — honour these unless they are genuinely unsuitable, and say so explicitly if they are.`
    : 'The student has no stated preference, so choose freely.'
}

${context.OVERVIEW ? `PROJECT OVERVIEW\n${JSON.stringify(context.OVERVIEW)}` : ''}

Guidance:
- The rationale must justify the choice against this project's constraints, not list generic advantages.
- "alternativesConsidered" must name a real alternative AND the reason it was not chosen.
- If AI integration is not required, return an empty array for aiModels.
${buildOutputContract(`{
  "frontend": ["technology", "..."],
  "backend": ["technology", "..."],
  "database": ["technology", "..."],
  "aiModels": ["model or empty array"],
  "deployment": ["platform", "..."],
  "authentication": ["approach", "..."],
  "rationale": "one paragraph justifying this stack for THIS project",
  "alternativesConsidered": ["Alternative — why it was rejected", "..."]
}`)}`;

export default { version, outputSchema, buildPrompt };
