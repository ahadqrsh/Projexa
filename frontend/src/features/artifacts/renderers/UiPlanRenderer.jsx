import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const UiPlanRenderer = ({ content }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2">
      {content.screens?.map((screen) => (
        <Card key={screen.name}>
          <CardHeader>
            <CardTitle>{screen.name}</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-content-secondary">{screen.purpose}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {screen.keyComponents?.map((c) => (
                <span key={c} className="rounded-md border border-strong bg-base/40 px-2 py-0.5 text-xs text-content-secondary">
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {screen.userRoles?.map((r) => (
                <Badge key={r} variant="primary">{r}</Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader><CardTitle>Design system</CardTitle></CardHeader>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {content.designSystem?.colorPalette?.map((c, i) => (
            <Badge key={i} variant="accent">{c}</Badge>
          ))}
        </div>
        <p className="text-sm text-content-secondary"><span className="font-medium text-content-primary">Typography: </span>{content.designSystem?.typography}</p>
        <p className="text-sm text-content-secondary"><span className="font-medium text-content-primary">Component library: </span>{content.designSystem?.componentLibrary}</p>
      </CardBody>
    </Card>

    <div className="space-y-3">
      {content.userFlows?.map((flow) => (
        <Card key={flow.name}>
          <CardHeader><CardTitle>{flow.name}</CardTitle></CardHeader>
          <CardBody>
            <ol className="space-y-1.5">
              {flow.steps?.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-content-secondary">
                  <span className="font-mono text-xs text-primary-400">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      ))}
    </div>
  </div>
);

export default UiPlanRenderer;
