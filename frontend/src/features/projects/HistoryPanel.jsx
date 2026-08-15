import { useEffect, useState } from 'react';
import { Sparkles, Pencil, XCircle, FolderPlus, Clock3 } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { formatDate, timeAgo } from '@/utils/format';
import { cn } from '@/utils/cn';
import { projectApi } from './projectApi';

const ICONS = {
  project_created: FolderPlus,
  project_updated: Pencil,
  module_generated: Sparkles,
  module_edited: Pencil,
  module_version_saved: Clock3,
  module_failed: XCircle,
};

const ICON_STYLES = {
  project_created: 'text-primary-400',
  project_updated: 'text-info',
  module_generated: 'text-success',
  module_edited: 'text-accent-400',
  module_version_saved: 'text-content-muted',
  module_failed: 'text-danger',
};

const HistoryPanel = ({ projectId }) => {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    projectApi
      .history(projectId)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Could not load history');
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (error) return <p className="py-6 text-center text-sm text-danger">{error}</p>;

  if (!events) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-content-muted">No activity yet.</p>;
  }

  return (
    <ol className="space-y-1">
      {events.map((event, i) => {
        const Icon = ICONS[event.type] ?? Clock3;
        return (
          <li key={i} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-surface/50">
            <span className={cn('mt-0.5 shrink-0', ICON_STYLES[event.type])}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-content-primary">{event.label}</p>
              {event.error && <p className="mt-0.5 text-xs text-danger">{event.error}</p>}
            </div>
            <span title={formatDate(event.timestamp)} className="shrink-0 text-xs text-content-muted">
              {timeAgo(event.timestamp)}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export default HistoryPanel;
