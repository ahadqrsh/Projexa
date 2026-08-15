import { cn } from '@/utils/cn';

const variants = {
  default: 'bg-elevated text-content-secondary border-strong',
  primary: 'bg-primary-500/15 text-primary-400 border-primary-500/30',
  accent: 'bg-accent-500/15 text-accent-400 border-accent-500/30',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  info: 'bg-info/15 text-info border-info/30',
};

const Badge = ({ children, className, variant = 'default', dot = false, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
      'text-xs font-medium capitalize',
      variants[variant],
      className
    )}
    {...props}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

export default Badge;
