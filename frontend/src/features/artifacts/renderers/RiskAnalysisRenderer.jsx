import { Card, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { titleCase } from '@/utils/format';

const levelVariant = { low: 'success', medium: 'warning', high: 'danger' };

const RiskAnalysisRenderer = ({ content }) => (
  <div className="space-y-3">
    {content.risks?.map((risk, i) => (
      <Card key={i}>
        <CardBody>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-medium text-content-primary">{risk.title}</p>
            <div className="flex shrink-0 gap-1.5">
              <Badge>{titleCase(risk.category)}</Badge>
              <Badge variant={levelVariant[risk.likelihood]}>{risk.likelihood} likelihood</Badge>
              <Badge variant={levelVariant[risk.impact]}>{risk.impact} impact</Badge>
            </div>
          </div>
          <p className="mt-2 text-sm text-content-secondary">
            <span className="font-medium text-content-primary">Mitigation: </span>
            {risk.mitigation}
          </p>
        </CardBody>
      </Card>
    ))}
  </div>
);

export default RiskAnalysisRenderer;
