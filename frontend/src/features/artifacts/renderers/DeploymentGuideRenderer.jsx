import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { titleCase } from '@/utils/format';

const DeploymentGuideRenderer = ({ content }) => (
  <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2">
      {content.platforms?.map((p, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle>{p.platform}</CardTitle>
            <Badge variant="primary">{titleCase(p.component)}</Badge>
          </CardHeader>
          <CardBody>
            <ol className="space-y-1.5">
              {p.steps?.map((step, j) => (
                <li key={j} className="flex gap-2 text-sm text-content-secondary">
                  <span className="font-mono text-xs text-primary-400">{j + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader><CardTitle>Environment variables</CardTitle></CardHeader>
      <CardBody>
        <div className="overflow-hidden rounded-lg border border-subtle">
          <table className="w-full text-xs">
            <thead className="bg-surface/60 text-content-muted">
              <tr>
                <th className="px-2.5 py-1.5 text-left font-medium">Key</th>
                <th className="px-2.5 py-1.5 text-left font-medium">Description</th>
                <th className="px-2.5 py-1.5 text-left font-medium">Example</th>
                <th className="px-2.5 py-1.5 text-left font-medium">Required</th>
              </tr>
            </thead>
            <tbody>
              {content.environmentVariables?.map((v) => (
                <tr key={v.key} className="border-t border-subtle">
                  <td className="px-2.5 py-1.5 font-mono text-content-primary">{v.key}</td>
                  <td className="px-2.5 py-1.5 text-content-secondary">{v.description}</td>
                  <td className="px-2.5 py-1.5 font-mono text-content-muted">{v.example}</td>
                  <td className="px-2.5 py-1.5">{v.required ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>

    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">CI/CD</h3>
      <p className="text-sm leading-relaxed text-content-secondary">{content.cicdNotes}</p>
    </div>
  </div>
);

export default DeploymentGuideRenderer;
