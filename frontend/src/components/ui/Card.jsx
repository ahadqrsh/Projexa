import { cn } from '@/utils/cn';

export const Card = ({ children, className, glow = false, as: Tag = 'div', ...props }) => (
  <Tag
    className={cn(
      'rounded-xl border border-subtle bg-elevated/70 backdrop-blur-xl',
      'shadow-card transition-all duration-300 ease-smooth',
      glow && 'glow-border',
      className
    )}
    {...props}
  >
    {children}
  </Tag>
);

export const CardHeader = ({ children, className }) => (
  <div className={cn('flex items-start justify-between gap-4 p-5 pb-0', className)}>{children}</div>
);

export const CardTitle = ({ children, className }) => (
  <h3 className={cn('text-base font-semibold text-content-primary', className)}>{children}</h3>
);

export const CardDescription = ({ children, className }) => (
  <p className={cn('mt-1 text-sm text-content-secondary', className)}>{children}</p>
);

export const CardBody = ({ children, className }) => (
  <div className={cn('p-5', className)}>{children}</div>
);

export const CardFooter = ({ children, className }) => (
  <div className={cn('flex items-center gap-3 border-t border-subtle p-5', className)}>
    {children}
  </div>
);

export default Card;
