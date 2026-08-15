import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'roadmap@1.0';

export const outputSchema = z.object({
  totalWeeks: z.number().int().min(2).max(26),
  weeks: z
    .array(
      z.object({
        weekNumber: z.number().int().min(1),
        title: z.string().min(3),
        goal: z.string().min(10),
        deliverables: z.array(z.string().min(3)).min(1).max(8),
        tasks: z
          .array(
            z.object({
              title: z.string().min(3),
              category: z.enum([
                'setup',
                'backend',
                'frontend',
                'ai',
                'testing',
                'deployment',
                'documentation',
              ]),
              estimatedHours: z.number().min(1).max(60),
            })
          )
          .min(1)
          .max(10),
      })
    )
    .min(2)
    .max(26),
  milestones: z
    .array(
      z.object({
        weekNumber: z.number().int().min(1),
        title: z.string().min(3),
      })
    )
    .min(1)
    .max(10),
});

export const buildPrompt = (project, context = {}) => `Build a week-by-week roadmap for this project.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Difficulty: ${project.difficulty}
Team size: ${project.teamSize}
${project.deadline ? `Deadline: ${project.deadline}` : 'No fixed deadline was given — plan for a typical academic semester (12-14 weeks).'}

${context.OVERVIEW ? `OVERVIEW\n${JSON.stringify(context.OVERVIEW)}\n` : ''}
${context.FEATURES ? `AGREED FEATURES — every high-priority feature must be scheduled somewhere in the roadmap\n${JSON.stringify(context.FEATURES)}` : ''}

Guidance:
- If a deadline was given, compute totalWeeks from today to that date (round down) and use exactly that many weeks. Otherwise use 12-14.
- Week 1 is always setup and environment configuration; the final week is always testing, polish and submission prep.
- Distribute tasks realistically across a team of ${project.teamSize} — do not schedule more work in a week than that team could plausibly complete.
- Every "high" priority feature from the agreed feature list must appear as a deliverable or task in some week.
- Milestones mark weeks with a demonstrable checkpoint (e.g. "Authentication working end-to-end"), not every week needs one.
${buildOutputContract(`{
  "totalWeeks": 12,
  "weeks": [
    {
      "weekNumber": 1,
      "title": "short title",
      "goal": "what should be true by the end of this week",
      "deliverables": ["concrete deliverable", "..."],
      "tasks": [
        { "title": "task title", "category": "setup | backend | frontend | ai | testing | deployment | documentation", "estimatedHours": 6 }
      ]
    }
  ],
  "milestones": [{ "weekNumber": 4, "title": "milestone description" }]
}`)}`;

export default { version, outputSchema, buildPrompt };
