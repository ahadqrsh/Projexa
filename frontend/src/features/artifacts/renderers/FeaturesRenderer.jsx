import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const priorityVariant = { high: 'danger', medium: 'warning', low: 'default' };

const FeaturesRenderer = ({ content }) => (
  <div className="space-y-5">
    {content.roles?.map((role) => (
      <Card key={role.role}>
        <CardHeader>
          <CardTitle>{role.role}</CardTitle>
          <Badge variant="primary">{role.features?.length ?? 0} features</Badge>
        </CardHeader>
        <CardBody className="space-y-3">
          {role.features?.map((f) => (
            <div key={f.name} className="flex items-start justify-between gap-3 rounded-lg border border-subtle p-3">
              <div>
                <p className="text-sm font-medium text-content-primary">{f.name}</p>
                <p className="mt-1 text-sm text-content-secondary">{f.description}</p>
              </div>
              <Badge variant={priorityVariant[f.priority]} className="shrink-0">{f.priority}</Badge>
            </div>
          ))}
        </CardBody>
      </Card>
    ))}
  </div>
);

export default FeaturesRenderer;
