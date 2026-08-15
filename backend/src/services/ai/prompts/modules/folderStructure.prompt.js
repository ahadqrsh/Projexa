import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'folderStructure@1.0';

const entrySchema = z.object({
  path: z.string().min(1),
  type: z.enum(['folder', 'file']),
  purpose: z.string().min(5),
});

export const outputSchema = z.object({
  frontend: z.object({
    root: z.string().min(1),
    entries: z.array(entrySchema).min(5).max(60),
  }),
  backend: z.object({
    root: z.string().min(1),
    entries: z.array(entrySchema).min(5).max(60),
  }),
  conventions: z.array(z.string().min(5)).min(2).max(10),
});

export const buildPrompt = (project, context = {}) => `Design the folder structure for this project's codebase.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Project type: ${project.projectType}

${context.TECH_STACK ? `AGREED TECH STACK — the folder structure must match these technologies exactly\n${JSON.stringify(context.TECH_STACK)}\n` : ''}
${context.DATABASE_DESIGN ? `DATABASE SCHEMA — used only to judge how many model/repository files are realistic\n${JSON.stringify(context.DATABASE_DESIGN)}` : ''}

Guidance:
- Produce two trees: one for the frontend root, one for the backend root.
- "path" is relative to that root, using forward slashes, e.g. "src/features/auth/authSlice.js".
- List folders before the files they contain is not required — order however reads naturally, but every folder that contains listed files must itself appear as an entry with type "folder".
- Every entry needs a one-sentence "purpose" explaining what lives there, not a restatement of the name.
- Depth should be realistic for the project's scale — do not invent structure nothing in the stack would need.
- "conventions" are short rules a contributor should follow (naming, where business logic lives, etc.), not generic advice.
${buildOutputContract(`{
  "frontend": {
    "root": "top-level folder name, e.g. frontend",
    "entries": [
      { "path": "src/components", "type": "folder", "purpose": "why this folder exists" },
      { "path": "src/components/Button.jsx", "type": "file", "purpose": "what this file does" }
    ]
  },
  "backend": {
    "root": "top-level folder name, e.g. backend",
    "entries": [
      { "path": "src/models", "type": "folder", "purpose": "why this folder exists" }
    ]
  },
  "conventions": ["short rule", "..."]
}`)}`;

export default { version, outputSchema, buildPrompt };
