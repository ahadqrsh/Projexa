import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ArrowRight } from 'lucide-react';

const DatabaseDesignRenderer = ({ content }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2">
      {content.collections?.map((col) => (
        <Card key={col.name}>
          <CardHeader>
            <CardTitle className="font-mono">{col.name}</CardTitle>
            <Badge>{col.fields?.length ?? 0} fields</Badge>
          </CardHeader>
          <CardBody>
            <p className="mb-3 text-sm text-content-secondary">{col.purpose}</p>
            <div className="overflow-hidden rounded-lg border border-subtle">
              <table className="w-full text-xs">
                <thead className="bg-surface/60 text-content-muted">
                  <tr>
                    <th className="px-2.5 py-1.5 text-left font-medium">Field</th>
                    <th className="px-2.5 py-1.5 text-left font-medium">Type</th>
                    <th className="px-2.5 py-1.5 text-left font-medium">Req.</th>
                  </tr>
                </thead>
                <tbody>
                  {col.fields?.map((field) => (
                    <tr key={field.name} className="border-t border-subtle">
                      <td className="px-2.5 py-1.5 font-mono text-content-primary">{field.name}</td>
                      <td className="px-2.5 py-1.5 font-mono text-content-secondary">{field.type}</td>
                      <td className="px-2.5 py-1.5">{field.required ? '✓' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Relationships</CardTitle>
      </CardHeader>
      <CardBody className="space-y-2">
        {content.relationships?.map((rel, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-subtle p-2.5 text-sm">
            <span className="font-mono text-content-primary">{rel.from}</span>
            <ArrowRight className="h-3.5 w-3.5 text-content-muted" />
            <span className="font-mono text-content-primary">{rel.to}</span>
            <Badge variant="primary">{rel.type}</Badge>
            <span className="text-content-secondary">{rel.description}</span>
          </div>
        ))}
      </CardBody>
    </Card>
  </div>
);

export default DatabaseDesignRenderer;
