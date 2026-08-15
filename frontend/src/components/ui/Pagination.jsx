import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

const buildRange = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
};

const Pagination = ({ page, totalPages, onChange, className }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-strong text-content-secondary transition-colors hover:border-primary-500 hover:text-primary-400 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {buildRange(page, totalPages).map((entry, index) =>
        entry === '…' ? (
          <span key={`gap-${index}`} className="px-2 text-content-muted">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(
              'h-9 min-w-[2.25rem] rounded-lg px-2 text-sm font-medium transition-all',
              entry === page
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-glow'
                : 'border border-strong text-content-secondary hover:border-primary-500 hover:text-primary-400'
            )}
          >
            {entry}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-strong text-content-secondary transition-colors hover:border-primary-500 hover:text-primary-400 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default Pagination;
