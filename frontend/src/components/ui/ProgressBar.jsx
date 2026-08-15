import { cn } from '@/utils/cn';

const ProgressBar = ({ value = 0, className, showLabel = false, size = 'md' }) => {
  const clamped = Math.min(Math.max(value, 0), 100);
  const height = { sm: 'h-1', md: 'h-2', lg: 'h-3' }[size];

  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn('w-full overflow-hidden rounded-full bg-surface', height, className)}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 via-accent-500 to-cyber-500 transition-[width] duration-700 ease-smooth"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 font-mono text-xs text-content-secondary">{clamped}%</span>
      )}
    </div>
  );
};

export default ProgressBar;
