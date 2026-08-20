import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles, RotateCw, Pencil, Save, X, AlertTriangle, Waypoints } from 'lucide-react';
import PageTransition from '@/components/motion/PageTransition';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Textarea from '@/components/ui/Textarea';
import { fetchProject, selectActiveProject } from '@/features/projects/projectSlice';
import { diagramsApi } from '@/features/diagrams/diagramsApi';
import { diagramLabel } from '@/features/diagrams/diagramTypes';
import MermaidDiagram from '@/features/diagrams/MermaidDiagram';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { timeAgo } from '@/utils/format';
import { paths } from '@/routes/paths';

const DiagramViewerPage = () => {
  const { id, type } = useParams();
  const dispatch = useDispatch();
  const project = useSelector(selectActiveProject);

  const [diagram, setDiagram] = useState(null);
  const [loadStatus, setLoadStatus] = useState('loading'); // loading | ready | notFound | error
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftSource, setDraftSource] = useState('');
  const [saving, setSaving] = useState(false);

  const label = diagramLabel(type);
  useDocumentTitle(project ? `${label} · ${project.title}` : label);

  useEffect(() => {
    if (!project || project._id !== id) dispatch(fetchProject(id));
  }, [dispatch, id, project]);

  const load = useCallback(async () => {
    setLoadStatus('loading');
    try {
      const data = await diagramsApi.get(id, type);
      setDiagram(data);
      setLoadStatus('ready');
    } catch (error) {
      setLoadStatus(error.status === 404 ? 'notFound' : 'error');
      if (error.status !== 404) toast.error(error.message ?? 'Could not load this diagram');
    }
  }, [id, type]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await diagramsApi.generate(id, type);
      setDiagram(result);
      setLoadStatus('ready');
      toast.success(`${label} generated`);
    } catch (error) {
      toast.error(error.message ?? 'Could not generate this diagram');
    } finally {
      setGenerating(false);
    }
  };

  const startEditing = () => {
    setDraftSource(diagram?.source ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await diagramsApi.update(id, type, { source: draftSource });
      setDiagram(updated);
      setEditing(false);
      toast.success('Diagram source saved');
    } catch (error) {
      toast.error(error.message ?? 'Could not save this diagram');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="mx-auto max-w-5xl space-y-6">
      <Link to={paths.project(id)}>
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to project
        </Button>
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-content-primary">
            <Waypoints className="h-5 w-5 text-primary-400" />
            {diagram?.title || label}
          </h1>
          {loadStatus === 'ready' && diagram && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-content-muted">
              <span>Version {diagram.version}</span>
              {diagram.generatedAt && <span>· generated {timeAgo(diagram.generatedAt)}</span>}
              {diagram.isManuallyEdited && <Badge variant="info">Manually edited</Badge>}
            </div>
          )}
        </div>

        {loadStatus === 'ready' && diagram && !editing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={startEditing} leftIcon={<Pencil className="h-3.5 w-3.5" />}>
              Edit source
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerate}
              loading={generating}
              disabled={generating}
              leftIcon={<RotateCw className="h-3.5 w-3.5" />}
            >
              Regenerate
            </Button>
          </div>
        )}
      </header>

      {loadStatus === 'loading' && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {loadStatus === 'notFound' && (
        <EmptyState
          icon={<Waypoints className="h-7 w-7" />}
          title="Not generated yet"
          description={`${label} hasn't been generated for this project yet. It's produced as Mermaid diagram source by the same AI model as the other modules, then rendered in your browser — no extra setup required.`}
          action={
            <Button onClick={handleGenerate} loading={generating} leftIcon={<Sparkles className="h-4 w-4" />}>
              Generate {label}
            </Button>
          }
        />
      )}

      {loadStatus === 'error' && (
        <EmptyState
          icon={<AlertTriangle className="h-7 w-7" />}
          title="Could not load this diagram"
          description="Something went wrong fetching this content. Try again in a moment."
          action={
            <Button variant="secondary" onClick={load}>
              Retry
            </Button>
          }
        />
      )}

      {loadStatus === 'ready' && diagram && editing && (
        <div className="space-y-3">
          <Textarea
            value={draftSource}
            onChange={(e) => setDraftSource(e.target.value)}
            rows={16}
            className="font-mono text-xs"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} loading={saving} leftIcon={<Save className="h-3.5 w-3.5" />}>
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              disabled={saving}
              leftIcon={<X className="h-3.5 w-3.5" />}
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-content-muted">
            Live preview updates below as you type — invalid Mermaid syntax shows an error instead of a blank panel.
          </p>
          <MermaidDiagram source={draftSource} filename={type.toLowerCase()} />
        </div>
      )}

      {loadStatus === 'ready' && diagram && !editing && (
        <MermaidDiagram source={diagram.source} filename={type.toLowerCase()} />
      )}

      {loadStatus === 'ready' && diagram?.error?.message && (
        <p className="text-xs text-danger">Last generation error: {diagram.error.message}</p>
      )}
    </PageTransition>
  );
};

export default DiagramViewerPage;
