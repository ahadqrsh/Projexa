import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

const methodColors = {
  GET: 'text-info border-info/30 bg-info/10',
  POST: 'text-success border-success/30 bg-success/10',
  PUT: 'text-warning border-warning/30 bg-warning/10',
  PATCH: 'text-accent-400 border-accent-500/30 bg-accent-500/10',
  DELETE: 'text-danger border-danger/30 bg-danger/10',
};

const ApiDesignRenderer = ({ content }) => (
  <div className="space-y-5">
    {content.groups?.map((group) => (
      <Card key={group.resource}>
        <CardHeader>
          <CardTitle>{group.resource}</CardTitle>
          <Badge>{group.endpoints?.length ?? 0} endpoints</Badge>
        </CardHeader>
        <CardBody className="space-y-2.5">
          {group.endpoints?.map((ep, i) => (
            <div key={i} className="rounded-lg border border-subtle p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 font-mono text-xs font-semibold',
                    methodColors[ep.method]
                  )}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-sm text-content-primary">{ep.path}</span>
                <Badge variant="default">{ep.auth}</Badge>
              </div>
              <p className="mt-1.5 text-sm text-content-secondary">{ep.description}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {ep.statusCodes?.map((code) => (
                  <span key={code} className="rounded bg-base/40 px-1.5 py-0.5 font-mono text-[11px] text-content-muted">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    ))}
  </div>
);

export default ApiDesignRenderer;
