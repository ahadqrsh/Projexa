import { z } from 'zod';
import { DOMAINS, DIFFICULTIES, PROJECT_TYPES } from '@/utils/constants';

export const projectSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  description: z
    .string()
    .min(20, 'Describe your idea in at least 20 characters — the AI needs detail to work with')
    .max(2000, 'Description cannot exceed 2000 characters'),
  domain: z.enum(DOMAINS, { errorMap: () => ({ message: 'Choose a domain' }) }),
  difficulty: z.enum(DIFFICULTIES, { errorMap: () => ({ message: 'Choose a difficulty' }) }),
  projectType: z.enum(PROJECT_TYPES).optional(),
  teamSize: z.coerce.number().int().min(1, 'At least 1').max(20, 'At most 20'),
  preferredTech: z.array(z.string()).max(25).optional(),
  tags: z.array(z.string()).max(15).optional(),
  deadline: z.string().optional().or(z.literal('')),
  aiIntegrationRequired: z.boolean().optional(),
});

export const stepFields = [
  ['title', 'description'],
  ['domain', 'difficulty', 'projectType'],
  ['teamSize', 'preferredTech', 'deadline', 'aiIntegrationRequired'],
  [],
];

export const defaultProjectValues = {
  title: '',
  description: '',
  domain: '',
  difficulty: '',
  projectType: 'web',
  teamSize: 1,
  preferredTech: [],
  tags: [],
  deadline: '',
  aiIntegrationRequired: false,
};
