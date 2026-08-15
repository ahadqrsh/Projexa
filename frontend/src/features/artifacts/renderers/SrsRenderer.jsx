import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const priorityVariant = { high: 'danger', medium: 'warning', low: 'default' };

const SrsRenderer = ({ content }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Functional requirements</CardTitle>
        <Badge variant="primary">{content.functional?.length ?? 0}</Badge>
      </CardHeader>
      <CardBody className="space-y-2.5">
        {content.functional?.map((req) => (
          <div key={req.id} className="rounded-lg border border-subtle p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-content-primary">
                <span className="mr-2 font-mono text-xs text-primary-400">{req.id}</span>
                {req.title}
              </p>
              <Badge variant={priorityVariant[req.priority]} className="shrink-0">{req.priority}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-content-secondary">{req.description}</p>
          </div>
        ))}
      </CardBody>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Non-functional requirements</CardTitle>
        <Badge variant="accent">{content.nonFunctional?.length ?? 0}</Badge>
      </CardHeader>
      <CardBody className="space-y-2.5">
        {content.nonFunctional?.map((req, i) => (
          <div key={i} className="rounded-lg border border-subtle p-3">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="info">{req.category}</Badge>
              <span className="font-mono text-xs text-content-muted">{req.metric}</span>
            </div>
            <p className="mt-1.5 text-sm text-content-secondary">{req.requirement}</p>
          </div>
        ))}
      </CardBody>
    </Card>
  </div>
);

export default SrsRenderer;
