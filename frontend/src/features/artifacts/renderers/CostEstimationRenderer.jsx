import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { titleCase } from '@/utils/format';

const categoryVariant = { hosting: 'primary', tools: 'accent', apis: 'info', licenses: 'warning', other: 'default' };

const CostEstimationRenderer = ({ content }) => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardBody>
          <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">Monthly total</p>
          <p className="mt-1 text-2xl font-bold text-content-primary">
            {content.totalMonthlyCost} <span className="text-sm font-normal text-content-muted">{content.currency}</span>
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">One-time total</p>
          <p className="mt-1 text-2xl font-bold text-content-primary">
            {content.totalOneTimeCost} <span className="text-sm font-normal text-content-muted">{content.currency}</span>
          </p>
        </CardBody>
      </Card>
    </div>

    <Card>
      <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
      <CardBody className="space-y-2">
        {content.items?.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-subtle p-2.5 text-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant={categoryVariant[item.category] ?? 'default'}>{titleCase(item.category)}</Badge>
                <span className="text-content-primary">{item.name}</span>
              </div>
              <p className="mt-1 text-xs text-content-muted">{item.notes}</p>
            </div>
            <span className="shrink-0 font-mono text-xs text-content-secondary">
              {item.estimatedCost} {content.currency} / {item.billingCycle}
            </span>
          </div>
        ))}
      </CardBody>
    </Card>

    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Free tier notes</h3>
      <p className="text-sm leading-relaxed text-content-secondary">{content.freeTierNotes}</p>
    </div>
  </div>
);

export default CostEstimationRenderer;
