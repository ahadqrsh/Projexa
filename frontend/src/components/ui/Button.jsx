import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const variants = {
  primary:
    'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-glow hover:shadow-glow-lg hover:brightness-110',
  secondary: 'bg-elevated text-content-primary border border-strong hover:border-primary-500/60',
  ghost: 'text-content-secondary hover:bg-elevated hover:text-content-primary',
  outline:
    'border border-primary-500/50 text-primary-400 hover:bg-primary-500/10 hover:border-primary-500',
  danger: 'bg-danger text-white hover:brightness-110',
  glass: 'glass text-content-primary hover:border-primary-500/50',
};

const sizes = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
  icon: 'h-10 w-10 justify-center',
};

const Button = forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center rounded-lg font-semibold',
        'transition-all duration-200 ease-smooth active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
);

Button.displayName = 'Button';
export default Button;
