import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';

export const version = 'costEstimation@1.0';

export const outputSchema = z.object({
  currency: z.string().min(2).max(6),
  items: z
    .array(
      z.object({
        category: z.enum(['hosting', 'tools', 'apis', 'licenses', 'other']),
        name: z.string().min(2),
        estimatedCost: z.number().min(0),
        billingCycle: z.enum(['one-time', 'monthly', 'yearly']),
        notes: z.string().min(5),
      })
    )
    .min(3)
    .max(15),
  totalMonthlyCost: z.number().min(0),
  totalOneTimeCost: z.number().min(0),
  freeTierNotes: z.string().min(10),
});

export const buildPrompt = (project, context = {}) => `Estimate the cost of building and running this project as a student project.

PROJECT IDEA
Title: ${project.title}
Difficulty: ${project.difficulty}

${context.TECH_STACK ? `TECH STACK — cost every relevant piece of this stack\n${JSON.stringify(context.TECH_STACK)}\n` : ''}
${context.ROADMAP ? `ROADMAP\n${JSON.stringify(context.ROADMAP)}` : ''}

Guidance:
- currency is a 3-letter code, default to "USD" unless the project clearly implies another.
- Prefer free-tier options for a student project and say so in freeTierNotes; only include a cost line if a paid tier would realistically be needed at real usage.
- billingCycle "one-time" is for things like a domain name or a one-off asset purchase.
- totalMonthlyCost = sum of all "monthly" items (annualized "yearly" items divided by 12). totalOneTimeCost = sum of all "one-time" items. Compute these correctly from the items list.
${buildOutputContract(`{
  "currency": "USD",
  "items": [
    { "category": "hosting", "name": "service name", "estimatedCost": 0, "billingCycle": "monthly", "notes": "why this cost / free tier limits" }
  ],
  "totalMonthlyCost": 0,
  "totalOneTimeCost": 0,
  "freeTierNotes": "summary of what's free and for how long"
}`)}`;

export default { version, outputSchema, buildPrompt };
