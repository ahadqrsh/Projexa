import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Folder, File } from 'lucide-react';

const Tree = ({ root, entries }) => (
  <div>
    <p className="mb-2 font-mono text-sm font-semibold text-content-primary">{root}/</p>
    <ul className="space-y-1 border-l border-subtle pl-3">
      {entries?.map((entry) => (
        <li key={entry.path} className="flex items-start gap-2 text-sm">
          {entry.type === 'folder' ? (
            <Folder className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-400" />
          ) : (
            <File className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-muted" />
          )}
          <span className="min-w-0">
            <span className="font-mono text-content-primary">{entry.path}</span>
            <span className="ml-2 text-xs text-content-muted">{entry.purpose}</span>
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const FolderStructureRenderer = ({ content }) => (
  <div className="space-y-6">
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Frontend</CardTitle></CardHeader>
        <CardBody><Tree {...content.frontend} /></CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Backend</CardTitle></CardHeader>
        <CardBody><Tree {...content.backend} /></CardBody>
      </Card>
    </div>

    {content.conventions?.length > 0 && (
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Conventions</h3>
        <ul className="space-y-1.5">
          {content.conventions.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-content-secondary">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary-400" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default FolderStructureRenderer;
