import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

const Select = forwardRef(({ className, error, options = [], placeholder, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      aria-invalid={Boolean(error)}
      className={cn(
        'h-11 w-full appearance-none rounded-lg border bg-surface px-3.5 pr-10 text-sm text-content-primary',
        'transition-all duration-200 ease-smooth',
        'focus:border-primary-500 focus:bg-elevated focus:outline-none focus:ring-2 focus:ring-primary-500/25',
        error ? 'border-danger' : 'border-strong',
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
  </div>
));

Select.displayName = 'Select';
export default Select;
