import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

const Input = forwardRef(({ className, error, leftIcon, rightElement, ...props }, ref) => (
  <div className="relative">
    {leftIcon && (
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted">
        {leftIcon}
      </span>
    )}
    <input
      ref={ref}
      aria-invalid={Boolean(error)}
      className={cn(
        'h-11 w-full rounded-lg border bg-surface px-3.5 text-sm text-content-primary',
        'placeholder:text-content-muted',
        'transition-all duration-200 ease-smooth',
        'focus:border-primary-500 focus:bg-elevated focus:outline-none focus:ring-2 focus:ring-primary-500/25',
        'disabled:cursor-not-allowed disabled:opacity-60',
        error ? 'border-danger focus:border-danger focus:ring-danger/25' : 'border-strong',
        leftIcon && 'pl-11',
        rightElement && 'pr-11',
        className
      )}
      {...props}
    />
    {rightElement && (
      <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightElement}</span>
    )}
  </div>
));

Input.displayName = 'Input';
export default Input;
