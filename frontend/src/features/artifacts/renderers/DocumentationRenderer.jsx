import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';

const DocumentationRenderer = ({ content }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>{content.readme?.title}</CardTitle></CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm leading-relaxed text-content-secondary">{content.readme?.description}</p>
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-content-muted">Installation</h4>
          <div className="space-y-1 rounded-lg border border-subtle bg-base/60 p-3 font-mono text-xs text-content-secondary">
            {content.readme?.installationSteps?.map((s, i) => (
              <p key={i}>$ {s}</p>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-content-muted">Usage</h4>
          <ul className="space-y-1.5">
            {content.readme?.usageInstructions?.map((u, i) => (
              <li key={i} className="flex gap-2 text-sm text-content-secondary">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary-400" />
                {u}
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>

    {content.sections?.map((section) => (
      <Card key={section.heading}>
        <CardHeader><CardTitle>{section.heading}</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm leading-relaxed text-content-secondary">{section.content}</p>
        </CardBody>
      </Card>
    ))}
  </div>
);

export default DocumentationRenderer;
