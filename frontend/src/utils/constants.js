export const DOMAINS = [
  'healthcare',
  'education',
  'finance',
  'ecommerce',
  'social',
  'iot',
  'agriculture',
  'transport',
  'entertainment',
  'security',
  'productivity',
  'other',
];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'];

export const PROJECT_TYPES = ['web', 'mobile', 'desktop', 'ml', 'data', 'embedded', 'other'];

export const PROJECT_STATUSES = [
  'draft',
  'generating',
  'ready',
  'in_progress',
  'completed',
  'archived',
];

export const STATUS_STYLES = {
  draft: 'bg-content-muted/15 text-content-secondary border-content-muted/30',
  generating: 'bg-info/15 text-info border-info/30',
  ready: 'bg-primary-500/15 text-primary-400 border-primary-500/30',
  in_progress: 'bg-accent-500/15 text-accent-400 border-accent-500/30',
  completed: 'bg-success/15 text-success border-success/30',
  archived: 'bg-content-muted/10 text-content-muted border-content-muted/20',
};

export const DIFFICULTY_STYLES = {
  beginner: 'text-success',
  intermediate: 'text-info',
  advanced: 'text-warning',
  expert: 'text-danger',
};

export const DOMAIN_GRADIENTS = {
  healthcare: 'from-rose-500 to-pink-600',
  education: 'from-blue-500 to-indigo-600',
  finance: 'from-emerald-500 to-teal-600',
  ecommerce: 'from-amber-500 to-orange-600',
  social: 'from-fuchsia-500 to-purple-600',
  iot: 'from-cyan-500 to-sky-600',
  agriculture: 'from-lime-500 to-green-600',
  transport: 'from-slate-500 to-gray-600',
  entertainment: 'from-violet-500 to-purple-600',
  security: 'from-red-500 to-rose-700',
  productivity: 'from-indigo-500 to-blue-600',
  other: 'from-primary-500 to-accent-500',
};
