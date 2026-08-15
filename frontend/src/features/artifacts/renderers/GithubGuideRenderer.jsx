import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';

const GithubGuideRenderer = ({ content }) => (
  <div className="space-y-5">
    <Card>
      <CardHeader><CardTitle>Branching strategy</CardTitle></CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm leading-relaxed text-content-secondary">{content.branchingStrategy}</p>
        <div className="flex flex-wrap gap-2">
          {content.branches?.map((b) => (
            <span key={b.name} className="rounded-md border border-strong bg-base/40 px-2.5 py-1 text-xs">
              <span className="font-mono text-content-primary">{b.name}</span>
              <span className="ml-1.5 text-content-muted">— {b.purpose}</span>
            </span>
          ))}
        </div>
      </CardBody>
    </Card>

    <Card>
      <CardHeader><CardTitle>Commit convention</CardTitle></CardHeader>
      <CardBody className="space-y-2">
        <p className="font-mono text-sm text-content-primary">{content.commitConvention?.format}</p>
        <div className="space-y-1">
          {content.commitConvention?.examples?.map((ex, i) => (
            <p key={i} className="rounded bg-base/60 px-2 py-1 font-mono text-xs text-content-secondary">{ex}</p>
          ))}
        </div>
      </CardBody>
    </Card>

    <Card>
      <CardHeader><CardTitle>Daily workflow</CardTitle></CardHeader>
      <CardBody>
        <ol className="space-y-1.5">
          {content.workflowSteps?.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-content-secondary">
              <span className="font-mono text-xs text-primary-400">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>

    <Card>
      <CardHeader><CardTitle>PR guidelines</CardTitle></CardHeader>
      <CardBody>
        <ul className="space-y-1.5">
          {content.prGuidelines?.map((g, i) => (
            <li key={i} className="flex gap-2 text-sm text-content-secondary">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-400" />
              {g}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  </div>
);

export default GithubGuideRenderer;
