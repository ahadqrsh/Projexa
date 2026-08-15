import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'apiDesign@1.0';

export const outputSchema = z.object({
  groups: z
    .array(
      z.object({
        resource: z.string().min(2),
        endpoints: z
          .array(
            z.object({
              method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
              path: z.string().min(3),
              auth: z.string().min(2),
              description: z.string().min(8),
              requestExample: z.string(),
              responseExample: z.string(),
              statusCodes: z.array(z.number().int()).min(1),
            })
          )
          .min(1),
      })
    )
    .min(2)
    .max(12),
});

export const buildPrompt = (project, context = {}) => `Design the REST API for this project.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}

${
  context.DATABASE_DESIGN
    ? `DATABASE SCHEMA — every endpoint must operate on THESE collections. Do not invent new entities.\n${JSON.stringify(context.DATABASE_DESIGN)}\n`
    : ''
}
${context.SRS ? `FUNCTIONAL REQUIREMENTS\n${JSON.stringify(context.SRS)}` : ''}

Guidance:
- Group endpoints by resource, one group per major collection.
- Paths must be plural, kebab-case nouns, prefixed /api/v1.
- Use PATCH for partial updates, PUT only for full replacement.
- "auth" must be one of: public, required, admin, owner.
- statusCodes must list the realistic outcomes including error cases.
- requestExample and responseExample must be compact JSON strings, not objects.
${buildOutputContract(`{
  "groups": [
    {
      "resource": "resource name",
      "endpoints": [
        {
          "method": "GET",
          "path": "/api/v1/resource",
          "auth": "required",
          "description": "what it does",
          "requestExample": "compact JSON string or query string",
          "responseExample": "compact JSON string",
          "statusCodes": [200, 401]
        }
      ]
    }
  ]
}`)}`;

export default { version, outputSchema, buildPrompt };
