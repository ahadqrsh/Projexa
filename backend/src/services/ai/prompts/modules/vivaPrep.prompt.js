import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'vivaPrep@1.0';

export const outputSchema = z.object({
  categories: z
    .array(
      z.object({
        category: z.enum(['technical', 'conceptual', 'project_specific', 'viva_etiquette']),
        questions: z
          .array(
            z.object({
              question: z.string().min(10),
              modelAnswer: z.string().min(20),
              difficulty: z.enum(['easy', 'medium', 'hard']),
            })
          )
          .min(3)
          .max(15),
      })
    )
    .min(3)
    .max(4),
});

export const buildPrompt = (project, context = {}) => `Prepare viva voce (project defense) questions for this student.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Domain: ${project.domain}
Difficulty: ${project.difficulty}

${context.OVERVIEW ? `OVERVIEW\n${JSON.stringify(context.OVERVIEW)}\n` : ''}
${context.SRS ? `REQUIREMENTS — examiners often probe a specific FR or NFR by id\n${JSON.stringify(context.SRS)}\n` : ''}
${context.DATABASE_DESIGN ? `DATABASE DESIGN — examiners commonly ask "why this relationship/field"\n${JSON.stringify(context.DATABASE_DESIGN)}\n` : ''}
${context.TECH_STACK ? `TECH STACK — examiners commonly ask "why this over the alternative"\n${JSON.stringify(context.TECH_STACK)}` : ''}

Guidance:
- Use exactly these four categories: "technical" (implementation/code-level), "conceptual" (CS fundamentals the project touches — e.g. indexing, normalisation, REST, auth), "project_specific" (questions ONLY answerable by someone who built THIS project — reference actual entities, endpoints or decisions from the context above), "viva_etiquette" (how to present, handle a question you don't know, defend a design choice under pushback).
- "project_specific" questions must be impossible to answer generically — they should name a real collection, endpoint, requirement id or design decision from the context.
- modelAnswer must be a genuinely useful answer a student could learn from, not a one-line restatement of the question.
- Vary difficulty within each category; do not make every question "hard".
${buildOutputContract(`{
  "categories": [
    {
      "category": "technical | conceptual | project_specific | viva_etiquette",
      "questions": [
        { "question": "the question", "modelAnswer": "a full, useful answer", "difficulty": "easy | medium | hard" }
      ]
    }
  ]
}`)}`;

export default { version, outputSchema, buildPrompt };
