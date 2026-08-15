import { CheckCircle2, XCircle, Loader2, Clock, X as XIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { cn } from '@/utils/cn';
import { titleCase } from '@/utils/format';

// Per-module status strings come from GENERATION_STATUS (shared/constants/statuses.js):
// 'queued' | 'generating' | 'completed' | 'failed' (plus 'cancelled' if the job is cancelled
// mid-run). This is distinct from the job-level JOB_STATUS, which does use 'running'.
const STATUS_META = {
  queued: { icon: Clock, className: 'text-content-muted' },
  generating: { icon: Loader2, className: 'text-primary-400 animate-spin' },
  completed: { icon: CheckCircle2, className: 'text-success' },
  failed: { icon: XCircle, className: 'text-danger' },
  cancelled: { icon: XCircle, className: 'text-content-muted' },
};

/**
 * Renders whatever job is live for this project — queued / running / done —
 * driven entirely by useGenerationPolling. Nothing here owns a timer itself.
 */
const GenerationProgressPanel = ({ job, onCancel, onRetryModule, cancelling }) => {
  if (!job || job.overallStatus === 'idle') return null;

  const total = job.modules?.length ?? 0;
  const done =
    job.modules?.filter((m) => ['completed', 'failed', 'cancelled'].includes(m.status)).length ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : job.progress ?? 0;
  const isActive = ['queued', 'running'].includes(job.overallStatus);

  return (
    <div className="rounded-xl border border-strong bg-elevated/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-content-primary">
            {isActive ? 'Generating modules…' : titleCase(job.overallStatus)}
          </p>
          <p className="text-xs text-content-muted">
            {done} of {total} module{total === 1 ? '' : 's'} done
          </p>
        </div>
        {isActive && (
          <Button variant="ghost" size="sm" onClick={onCancel} loading={cancelling} leftIcon={<XIcon className="h-3.5 w-3.5" />}>
            Cancel
          </Button>
        )}
      </div>

      <ProgressBar value={percent} showLabel className="mb-4" />

      <ul className="space-y-1.5">
        {job.modules?.map((module) => {
          const meta = STATUS_META[module.status] ?? STATUS_META.queued;
          const Icon = meta.icon;
          return (
            <li key={module.type} className="rounded-md px-2 py-1.5 hover:bg-surface/60">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-content-secondary">
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', meta.className)} />
                  {titleCase(module.type)}
                </span>
                {module.status === 'failed' && (
                  <Button variant="outline" size="sm" onClick={() => onRetryModule(module.type)}>
                    Retry
                  </Button>
                )}
              </div>
              {module.status === 'failed' && module.error && (
                <p className="ml-[22px] mt-1 text-xs text-danger/90">{module.error}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GenerationProgressPanel;
