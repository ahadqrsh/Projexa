import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'sprintPlan@1.0';

export const outputSchema = z.object({
  sprintLengthWeeks: z.number().int().min(1).max(4),
  sprints: z
    .array(
      z.object({
        sprintNumber: z.number().int().min(1),
        goal: z.string().min(10),
        backlog: z
          .array(
            z.object({
              title: z.string().min(3),
              storyPoints: z.number().int().min(1).max(13),
              relatedFeature: z.string().min(2),
            })
          )
          .min(1)
          .max(12),
      })
    )
    .min(2)
    .max(13),
});

export const buildPrompt = (project, context = {}) => `Break this project's roadmap into Scrum sprints.

PROJECT IDEA
Title: ${project.title}
Team size: ${project.teamSize}

${context.ROADMAP ? `WEEKLY ROADMAP — convert this into sprints, do not invent a different timeline\n${JSON.stringify(context.ROADMAP)}\n` : ''}
${context.FEATURES ? `AGREED FEATURES\n${JSON.stringify(context.FEATURES)}` : ''}

Guidance:
- Choose sprintLengthWeeks (1-4) that divides the roadmap's totalWeeks reasonably; sprints together should span the whole roadmap.
- storyPoints use the Fibonacci-like scale: 1, 2, 3, 5, 8, 13.
- Every backlog item's relatedFeature must name a feature from the agreed feature list, or "technical debt" / "infrastructure" if it isn't feature work.
- The final sprint should be dominated by testing, bug fixing and submission prep.
${buildOutputContract(`{
  "sprintLengthWeeks": 2,
  "sprints": [
    {
      "sprintNumber": 1,
      "goal": "what this sprint achieves",
      "backlog": [{ "title": "backlog item", "storyPoints": 5, "relatedFeature": "feature name" }]
    }
  ]
}`)}`;

export default { version, outputSchema, buildPrompt };
