import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'githubGuide@1.0';

export const outputSchema = z.object({
  branchingStrategy: z.string().min(20),
  branches: z
    .array(
      z.object({
        name: z.string().min(2),
        purpose: z.string().min(5),
      })
    )
    .min(2)
    .max(6),
  commitConvention: z.object({
    format: z.string().min(5),
    examples: z.array(z.string().min(3)).min(2).max(6),
  }),
  workflowSteps: z.array(z.string().min(5)).min(3).max(10),
  prGuidelines: z.array(z.string().min(5)).min(2).max(8),
});

export const buildPrompt = (project, context = {}) => `Write a Git/GitHub workflow guide for this team.

PROJECT IDEA
Title: ${project.title}
Team size: ${project.teamSize}

${context.FOLDER_STRUCTURE ? `FOLDER STRUCTURE\n${JSON.stringify(context.FOLDER_STRUCTURE)}\n` : ''}
${context.TECH_STACK ? `TECH STACK\n${JSON.stringify(context.TECH_STACK)}` : ''}

Guidance:
- Pick a branching strategy proportionate to a team of ${project.teamSize} (a solo dev doesn't need GitFlow; a team of 4+ benefits from a simple feature-branch model).
- commitConvention.format should reference Conventional Commits (feat:, fix:, docs:, etc.) unless there's good reason not to.
- workflowSteps describe the day-to-day loop: branch, commit, push, PR, review, merge.
- prGuidelines are concrete review expectations (e.g. "at least one approval", "CI must pass"), not generic advice.
${buildOutputContract(`{
  "branchingStrategy": "description of the branching model and why it fits this team",
  "branches": [{ "name": "main", "purpose": "always deployable" }],
  "commitConvention": { "format": "type(scope): description", "examples": ["feat(auth): add JWT refresh"] },
  "workflowSteps": ["create a feature branch from main", "..."],
  "prGuidelines": ["at least one reviewer approval before merge", "..."]
}`)}`;

export default { version, outputSchema, buildPrompt };
