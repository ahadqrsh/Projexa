import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'documentation@1.0';

export const outputSchema = z.object({
  readme: z.object({
    title: z.string().min(3),
    description: z.string().min(20),
    installationSteps: z.array(z.string().min(3)).min(2).max(10),
    usageInstructions: z.array(z.string().min(3)).min(1).max(8),
  }),
  sections: z
    .array(
      z.object({
        heading: z.string().min(3),
        content: z.string().min(20),
      })
    )
    .min(3)
    .max(10),
});

export const buildPrompt = (project, context = {}) => `Write the project README and supporting documentation sections.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}

${context.OVERVIEW ? `OVERVIEW\n${JSON.stringify(context.OVERVIEW)}\n` : ''}
${context.TECH_STACK ? `TECH STACK\n${JSON.stringify(context.TECH_STACK)}\n` : ''}
${context.FOLDER_STRUCTURE ? `FOLDER STRUCTURE\n${JSON.stringify(context.FOLDER_STRUCTURE)}\n` : ''}
${context.API_DESIGN ? `API DESIGN\n${JSON.stringify(context.API_DESIGN)}` : ''}

Guidance:
- installationSteps must be concrete shell-level steps (clone, install, env vars, run) in order.
- sections should cover things a README alone does not: e.g. "Architecture Overview", "Environment Variables", "Folder Structure", "API Overview", "Known Limitations", "Future Work". Pick sections that fit THIS project.
- Keep every section grounded in the actual tech stack and structure given above — do not invent technologies not listed.
${buildOutputContract(`{
  "readme": {
    "title": "project title",
    "description": "1-2 paragraph description",
    "installationSteps": ["git clone ...", "npm install", "..."],
    "usageInstructions": ["how to run it", "..."]
  },
  "sections": [{ "heading": "Architecture Overview", "content": "detailed paragraph" }]
}`)}`;

export default { version, outputSchema, buildPrompt };
