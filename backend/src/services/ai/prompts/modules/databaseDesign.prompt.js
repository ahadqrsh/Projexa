import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'databaseDesign@1.0';

export const outputSchema = z.object({
  collections: z
    .array(
      z.object({
        name: z.string().min(2),
        purpose: z.string().min(10),
        fields: z
          .array(
            z.object({
              name: z.string().min(1),
              type: z.string().min(2),
              required: z.boolean(),
              description: z.string().min(3),
            })
          )
          .min(3),
      })
    )
    .min(3)
    .max(15),
  relationships: z
    .array(
      z.object({
        from: z.string().min(2),
        to: z.string().min(2),
        type: z.string().min(3),
        description: z.string().min(10),
      })
    )
    .min(1),
});

export const buildPrompt = (project, context = {}) => `Design the MongoDB database for this project.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Domain: ${project.domain}

${context.FEATURES ? `FEATURES THE SCHEMA MUST SUPPORT\n${JSON.stringify(context.FEATURES)}\n` : ''}
${context.SRS ? `FUNCTIONAL REQUIREMENTS\n${JSON.stringify(context.SRS)}` : ''}

Guidance:
- Collection names must be lowercase and plural.
- Every collection needs _id and createdAt.
- Use "ObjectId" as the type for references and name the referenced collection in the description.
- Include a users collection with a role field.
- Do NOT invent collections that no listed feature requires.
- Relationship "type" must be one of: one-to-one, one-to-many, many-to-one, many-to-many.
${buildOutputContract(`{
  "collections": [
    {
      "name": "collectionname",
      "purpose": "what this collection stores and why",
      "fields": [
        { "name": "fieldName", "type": "String | Number | Boolean | Date | ObjectId | Array | Object", "required": true, "description": "what it holds" }
      ]
    }
  ],
  "relationships": [
    { "from": "collectionA", "to": "collectionB", "type": "many-to-one", "description": "how and why they relate" }
  ]
}`)}`;

export default { version, outputSchema, buildPrompt };
