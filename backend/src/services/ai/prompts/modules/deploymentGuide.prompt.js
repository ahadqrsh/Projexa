import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'deploymentGuide@1.0';

export const outputSchema = z.object({
  platforms: z
    .array(
      z.object({
        component: z.enum(['frontend', 'backend', 'database']),
        platform: z.string().min(2),
        steps: z.array(z.string().min(5)).min(2).max(10),
      })
    )
    .min(2)
    .max(4),
  environmentVariables: z
    .array(
      z.object({
        key: z.string().min(2),
        description: z.string().min(5),
        example: z.string(),
        required: z.boolean(),
      })
    )
    .min(3)
    .max(15),
  cicdNotes: z.string().min(20),
});

export const buildPrompt = (project, context = {}) => `Write the deployment guide for this project.

PROJECT IDEA
Title: ${project.title}

${context.TECH_STACK ? `TECH STACK — deploy exactly this stack, do not substitute different services\n${JSON.stringify(context.TECH_STACK)}\n` : ''}
${context.FOLDER_STRUCTURE ? `FOLDER STRUCTURE\n${JSON.stringify(context.FOLDER_STRUCTURE)}` : ''}

Guidance:
- One platforms entry per major component that needs hosting (typically frontend, backend, and database — omit database if none is used).
- Prefer free-tier-friendly platforms suited to a student project (e.g. Vercel/Netlify for frontend, Render/Railway for backend, MongoDB Atlas for database) unless the tech stack clearly requires something else.
- environmentVariables must list every variable a deployer would actually need to set, with a realistic (not secret) example value.
- cicdNotes should describe a minimal, appropriate CI/CD setup — it does not need to be elaborate for a student project.
${buildOutputContract(`{
  "platforms": [
    { "component": "frontend", "platform": "platform name", "steps": ["step 1", "step 2"] }
  ],
  "environmentVariables": [
    { "key": "MONGO_URI", "description": "what it's for", "example": "mongodb+srv://...", "required": true }
  ],
  "cicdNotes": "description of a minimal CI/CD setup appropriate for this project"
}`)}`;

export default { version, outputSchema, buildPrompt };
