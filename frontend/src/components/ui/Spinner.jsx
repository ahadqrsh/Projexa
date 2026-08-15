import { cn } from '@/utils/cn';

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

const Spinner = ({ size = 'md', className }) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn(
      'inline-block animate-spin rounded-full',
      'bg-[conic-gradient(from_0deg,transparent,rgb(var(--primary-500)))]',
      '[mask:radial-gradient(farthest-side,transparent_calc(100%-3px),#000_0)]',
      sizes[size],
      className
    )}
  />
);

export default Spinner;
