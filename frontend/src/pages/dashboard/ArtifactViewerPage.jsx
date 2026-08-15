import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Sparkles,
  RotateCw,
  History,
  AlertTriangle,
  FileQuestion,
  Loader2,
} from 'lucide-react';
import PageTransition from '@/components/motion/PageTransition';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { fetchProject, selectActiveProject } from '@/features/projects/projectSlice';
import { startGeneration, retryModule, selectJob } from '@/features/generation/generationSlice';
import { useGenerationPolling } from '@/hooks/useGenerationPolling';
import { artifactsApi } from '@/features/artifacts/artifactsApi';
import { getRenderer } from '@/features/artifacts/renderers';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, titleCase, timeAgo } from '@/utils/format';
import { paths } from '@/routes/paths';

const ArtifactViewerPage = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const project = useSelector(selectActiveProject);

  const [artifact, setArtifact] = useState(null);
  const [loadStatus, setLoadStatus] = useState('loading'); // loading | ready | notFound | error
  const [versions, setVersions] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [starting, setStarting] = useState(false);

  const storedJob = useSelector(selectJob(id));
  const job = useGenerationPolling(id, storedJob?.jobId);
  const liveStatus = job?.modules?.find((m) => m.type === type)?.status;
  const isRunning = liveStatus === 'queued' || liveStatus === 'generating';

  useDocumentTitle(project ? `${titleCase(type)} · ${project.title}` : titleCase(type));

  useEffect(() => {
    if (!project || project._id !== id) dispatch(fetchProject(id));
  }, [dispatch, id, project]);

  const loadArtifact = useCallback(async () => {
    setLoadStatus('loading');
    try {
      const data = await artifactsApi.get(id, type);
      setArtifact(data);
      setLoadStatus('ready');
    } catch (error) {
      setLoadStatus(error.status === 404 ? 'notFound' : 'error');
      if (error.status !== 404) toast.error(error.message ?? 'Could not load this module');
    }
  }, [id, type]);

  useEffect(() => {
    loadArtifact();
  }, [loadArtifact]);

  // Once a queued/running generation of THIS module reaches a terminal state,
  // reload it from the server rather than trying to reshape the job payload.
  useEffect(() => {
    if (liveStatus === 'completed' || liveStatus === 'failed') loadArtifact();
  }, [liveStatus, loadArtifact]);

  const handleGenerate = async () => {
    setStarting(true);
    const result = await dispatch(startGeneration({ projectId: id, modules: [type] }));
    setStarting(false);
    if (!startGeneration.fulfilled.match(result)) {
      toast.error(result.payload?.message ?? 'Could not start generation');
    }
  };

  const handleRegenerate = async () => {
    setStarting(true);
    const result = await dispatch(retryModule({ projectId: id, type }));
    setStarting(false);
    if (!retryModule.fulfilled.match(result)) {
      toast.error(result.payload?.message ?? 'Could not regenerate this module');
    }
  };

  const handleToggleVersions = async () => {
    if (!versions) {
      try {
        setVersions(await artifactsApi.versions(id, type));
      } catch (error) {
        toast.error(error.message ?? 'Could not load version history');
        return;
      }
    }
    setShowVersions((v) => !v);
  };

  const handleRestore = async (version) => {
    setRestoringVersion(version);
    try {
      const restored = await artifactsApi.restore(id, type, version);
      setArtifact(restored);
      setVersions(null);
      setShowVersions(false);
      toast.success(`Restored version ${restored.version}`);
    } catch (error) {
      toast.error(error.message ?? 'Could not restore that version');
    } finally {
      setRestoringVersion(null);
    }
  };

  const Renderer = getRenderer(type);

  return (
    <PageTransition className="mx-auto max-w-5xl space-y-6">
      <Link to={paths.project(id)}>
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to project
        </Button>
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">{titleCase(type)}</h1>
          {loadStatus === 'ready' && artifact && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-content-muted">
              <span>Version {artifact.version}</span>
              {artifact.generatedAt && <span>· generated {timeAgo(artifact.generatedAt)}</span>}
              {artifact.isManuallyEdited && <Badge variant="info">Manually edited</Badge>}
              {artifact.isStale && (
                <Badge variant="warning" dot>
                  <AlertTriangle className="h-3 w-3" /> Stale — an upstream module changed
                </Badge>
              )}
            </div>
          )}
        </div>

        {loadStatus === 'ready' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleVersions}
              leftIcon={<History className="h-3.5 w-3.5" />}
            >
              History
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRegenerate}
              loading={starting || isRunning}
              disabled={starting || isRunning}
              leftIcon={<RotateCw className="h-3.5 w-3.5" />}
            >
              Regenerate
            </Button>
          </div>
        )}
      </header>

      {showVersions && versions && (
        <div className="rounded-xl border border-strong bg-elevated/60 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
            Version history
          </h3>
          <ul className="space-y-1.5">
            <li className="flex items-center justify-between rounded-md bg-primary-500/10 px-3 py-2 text-sm">
              <span className="text-content-primary">
                Version {versions.current.version} <span className="text-content-muted">(current)</span>
              </span>
              <span className="text-xs text-content-muted">{formatDate(versions.current.generatedAt)}</span>
            </li>
            {versions.previous.map((v) => (
              <li
                key={v.version}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-surface/60"
              >
                <span className="text-content-secondary">Version {v.version}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-content-muted">{formatDate(v.generatedAt)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(v.version)}
                    loading={restoringVersion === v.version}
                  >
                    Restore
                  </Button>
                </span>
              </li>
            ))}
            {versions.previous.length === 0 && (
              <li className="px-3 py-2 text-sm text-content-muted">No earlier versions yet.</li>
            )}
          </ul>
        </div>
      )}

      {isRunning && (
        <div className="flex items-center gap-2 rounded-xl border border-primary-500/30 bg-primary-500/10 p-4 text-sm text-content-secondary">
          <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
          {liveStatus === 'queued' ? 'Queued — this module will start shortly…' : 'Generating…'}
        </div>
      )}

      {loadStatus === 'loading' && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {loadStatus === 'notFound' && !isRunning && (
        <EmptyState
          icon={<FileQuestion className="h-7 w-7" />}
          title="Not generated yet"
          description={`${titleCase(type)} hasn't been generated for this project yet.`}
          action={
            <Button onClick={handleGenerate} loading={starting} leftIcon={<Sparkles className="h-4 w-4" />}>
              Generate {titleCase(type)}
            </Button>
          }
        />
      )}

      {loadStatus === 'error' && (
        <EmptyState
          icon={<AlertTriangle className="h-7 w-7" />}
          title="Could not load this module"
          description="Something went wrong fetching this content. Try again in a moment."
          action={
            <Button variant="secondary" onClick={loadArtifact}>
              Retry
            </Button>
          }
        />
      )}

      {loadStatus === 'ready' && artifact && !isRunning && <Renderer content={artifact.content} />}
    </PageTransition>
  );
};

export default ArtifactViewerPage;
