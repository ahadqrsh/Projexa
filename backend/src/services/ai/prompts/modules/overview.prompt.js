import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'overview@1.0';

export const outputSchema = z.object({
  objective: z.string().min(20),
  scope: z.string().min(20),
  targetUsers: z.array(z.string().min(2)).min(1).max(8),
  realWorldProblem: z.string().min(20),
  expectedOutcome: z.string().min(20),
  keyBenefits: z.array(z.string().min(5)).min(2).max(8),
});

export const buildPrompt = (project) => `Analyse this final-year project idea and produce a project overview.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Domain: ${project.domain}
Difficulty: ${project.difficulty}
Team size: ${project.teamSize}
Project type: ${project.projectType}
AI integration required: ${project.aiIntegrationRequired ? 'yes' : 'no'}
${project.preferredTech?.length ? `Preferred technologies: ${project.preferredTech.join(', ')}` : ''}

Write the overview as it would appear in the opening chapter of a project report.
The "realWorldProblem" must describe a genuine, specific pain in the ${project.domain} domain — not a restatement of the title.
${buildOutputContract(`{
  "objective": "one paragraph — what this system sets out to achieve",
  "scope": "one paragraph — what is included AND what is explicitly out of scope",
  "targetUsers": ["distinct user group", "..."],
  "realWorldProblem": "one paragraph — the specific problem being solved today, and why current approaches fall short",
  "expectedOutcome": "one paragraph — what exists at the end of the project",
  "keyBenefits": ["concrete benefit", "..."]
}`)}`;

export default { version, outputSchema, buildPrompt };
