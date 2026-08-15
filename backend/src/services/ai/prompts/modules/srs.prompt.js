import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'srs@1.0';

export const outputSchema = z.object({
  functional: z
    .array(
      z.object({
        id: z.string().min(2),
        title: z.string().min(3),
        description: z.string().min(15),
        priority: z.enum(['high', 'medium', 'low']),
      })
    )
    .min(5)
    .max(25),
  nonFunctional: z
    .array(
      z.object({
        category: z.string().min(3),
        requirement: z.string().min(15),
        metric: z.string().min(2),
      })
    )
    .min(4)
    .max(12),
});

export const buildPrompt = (project, context = {}) => `Write the Software Requirement Specification for this project.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Domain: ${project.domain}
Difficulty: ${project.difficulty}

${context.OVERVIEW ? `OVERVIEW\n${JSON.stringify(context.OVERVIEW)}\n` : ''}
${context.FEATURES ? `AGREED FEATURES — every high-priority feature must map to at least one functional requirement\n${JSON.stringify(context.FEATURES)}` : ''}

Guidance:
- Functional requirement ids must be sequential: FR-01, FR-02, and so on.
- Each functional requirement must use the word "shall" and be independently testable.
- Non-functional categories should be drawn from: Security, Performance, Scalability, Reliability, Usability, Maintainability, Portability.
- Every non-functional requirement MUST have a measurable metric. "Fast" is not a metric; "p95 under 400 ms at 100 concurrent users" is.
${buildOutputContract(`{
  "functional": [
    { "id": "FR-01", "title": "short title", "description": "The system shall ...", "priority": "high | medium | low" }
  ],
  "nonFunctional": [
    { "category": "Security", "requirement": "The system must ...", "metric": "measurable target" }
  ]
}`)}`;

export default { version, outputSchema, buildPrompt };
