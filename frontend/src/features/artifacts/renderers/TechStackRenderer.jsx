import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { titleCase } from '@/utils/format';

const GROUPS = ['frontend', 'backend', 'database', 'aiModels', 'deployment', 'authentication'];

const TechStackRenderer = ({ content }) => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {GROUPS.filter((g) => content[g]?.length).map((group) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle>{titleCase(group)}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-1.5">
            {content[group].map((item) => (
              <span
                key={item}
                className="rounded-md border border-strong bg-base/40 px-2 py-1 font-mono text-xs text-content-secondary"
              >
                {item}
              </span>
            ))}
          </CardBody>
        </Card>
      ))}
    </div>

    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Rationale</h3>
      <p className="text-sm leading-relaxed text-content-secondary">{content.rationale}</p>
    </div>

    {content.alternativesConsidered?.length > 0 && (
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
          Alternatives considered
        </h3>
        <ul className="space-y-1.5">
          {content.alternativesConsidered.map((a, i) => (
            <li key={i} className="flex gap-2 text-sm text-content-secondary">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-400" />
              {a}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default TechStackRenderer;
