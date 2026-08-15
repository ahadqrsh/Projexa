import { cn } from '@/utils/cn';
import { initialsOf } from '@/utils/format';

const sizes = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const Avatar = ({ src, name = '', size = 'md', className, ring = false }) => (
  <div
    className={cn(
      'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
      'bg-gradient-to-br from-primary-500 to-accent-600 font-semibold text-white',
      ring && 'ring-2 ring-primary-500/50 ring-offset-2 ring-offset-base',
      sizes[size],
      className
    )}
  >
    {src ? (
      <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
    ) : (
      <span>{initialsOf(name) || '?'}</span>
    )}
  </div>
);

export default Avatar;
