import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'uiPlan@1.0';

export const outputSchema = z.object({
  screens: z
    .array(
      z.object({
        name: z.string().min(2),
        purpose: z.string().min(10),
        keyComponents: z.array(z.string().min(2)).min(1).max(8),
        userRoles: z.array(z.string().min(2)).min(1).max(4),
      })
    )
    .min(3)
    .max(15),
  designSystem: z.object({
    colorPalette: z.array(z.string().min(2)).min(2).max(6),
    typography: z.string().min(10),
    componentLibrary: z.string().min(2),
  }),
  userFlows: z
    .array(
      z.object({
        name: z.string().min(3),
        steps: z.array(z.string().min(3)).min(2).max(10),
      })
    )
    .min(1)
    .max(6),
});

export const buildPrompt = (project, context = {}) => `Design the UI/UX plan for this project.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Domain: ${project.domain}

${context.FEATURES ? `AGREED FEATURES — every role must have at least one screen that serves it\n${JSON.stringify(context.FEATURES)}\n` : ''}
${context.TECH_STACK ? `TECH STACK\n${JSON.stringify(context.TECH_STACK)}` : ''}

Guidance:
- List the minimum screen set needed to deliver every agreed feature — do not pad with screens nothing requires.
- keyComponents are UI building blocks (e.g. "appointment card", "data table with filters"), not generic terms like "button".
- designSystem.componentLibrary should name a real library appropriate for the chosen frontend stack (e.g. shadcn/ui, MUI, Chakra UI).
- userFlows describe the click-by-click path a user takes to complete one important task, from entry screen to completion.
${buildOutputContract(`{
  "screens": [
    { "name": "screen name", "purpose": "what it's for", "keyComponents": ["component"], "userRoles": ["role"] }
  ],
  "designSystem": { "colorPalette": ["primary color / role", "..."], "typography": "font choices and rationale", "componentLibrary": "library name" },
  "userFlows": [{ "name": "flow name", "steps": ["step 1", "step 2"] }]
}`)}`;

export default { version, outputSchema, buildPrompt };
