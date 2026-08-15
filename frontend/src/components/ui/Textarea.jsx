import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

const Textarea = forwardRef(({ className, error, rows = 5, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    aria-invalid={Boolean(error)}
    className={cn(
      'w-full resize-y rounded-lg border bg-surface px-3.5 py-3 text-sm text-content-primary',
      'placeholder:text-content-muted',
      'transition-all duration-200 ease-smooth',
      'focus:border-primary-500 focus:bg-elevated focus:outline-none focus:ring-2 focus:ring-primary-500/25',
      error ? 'border-danger focus:border-danger focus:ring-danger/25' : 'border-strong',
      className
    )}
    {...props}
  />
));

Textarea.displayName = 'Textarea';
export default Textarea;
