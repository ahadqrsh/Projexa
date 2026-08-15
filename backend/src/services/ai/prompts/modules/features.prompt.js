import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'features@1.0';

export const outputSchema = z.object({
  roles: z
    .array(
      z.object({
        role: z.string().min(2),
        features: z
          .array(
            z.object({
              name: z.string().min(2),
              description: z.string().min(10),
              priority: z.enum(['high', 'medium', 'low']),
            })
          )
          .min(2)
          .max(12),
      })
    )
    .min(2)
    .max(6),
});

export const buildPrompt = (project, context = {}) => `Propose the feature set for this project, organised by user role.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Domain: ${project.domain}
Difficulty: ${project.difficulty}
Team size: ${project.teamSize}

${context.OVERVIEW ? `PROJECT OVERVIEW (already agreed — stay consistent with it)\n${JSON.stringify(context.OVERVIEW)}` : ''}

Guidance:
- Derive the roles from the target users, not from a generic admin/user template.
- Scope the total feature count to what a team of ${project.teamSize} can build at ${project.difficulty} level.
- Mark as "high" only the features without which the project fails its objective.
${buildOutputContract(`{
  "roles": [
    {
      "role": "role name",
      "features": [
        { "name": "feature name", "description": "what it does, in one sentence", "priority": "high | medium | low" }
      ]
    }
  ]
}`)}`;

export default { version, outputSchema, buildPrompt };
