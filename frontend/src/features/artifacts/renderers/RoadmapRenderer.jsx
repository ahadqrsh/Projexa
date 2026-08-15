import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { titleCase } from '@/utils/format';

const categoryVariant = {
  setup: 'default',
  backend: 'primary',
  frontend: 'info',
  ai: 'accent',
  testing: 'warning',
  deployment: 'success',
  documentation: 'default',
};

const RoadmapRenderer = ({ content }) => (
  <div className="space-y-5">
    <p className="text-sm text-content-secondary">
      {content.totalWeeks} week plan · {content.milestones?.length ?? 0} milestones
    </p>

    {content.weeks?.map((week) => {
      const milestone = content.milestones?.find((m) => m.weekNumber === week.weekNumber);
      return (
        <Card key={week.weekNumber}>
          <CardHeader>
            <div>
              <CardTitle>
                Week {week.weekNumber} · {week.title}
              </CardTitle>
              <p className="mt-1 text-sm text-content-secondary">{week.goal}</p>
            </div>
            {milestone && <Badge variant="accent">Milestone</Badge>}
          </CardHeader>
          <CardBody className="space-y-3">
            {week.deliverables?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {week.deliverables.map((d, i) => (
                  <span key={i} className="rounded-md border border-strong bg-base/40 px-2 py-0.5 text-xs text-content-secondary">
                    {d}
                  </span>
                ))}
              </div>
            )}
            <ul className="space-y-1.5">
              {week.tasks?.map((task, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-md border border-subtle p-2 text-sm">
                  <span className="flex items-center gap-2 text-content-secondary">
                    <Badge variant={categoryVariant[task.category] ?? 'default'}>{titleCase(task.category)}</Badge>
                    {task.title}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-content-muted">{task.estimatedHours}h</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      );
    })}
  </div>
);

export default RoadmapRenderer;
