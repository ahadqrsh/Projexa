import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Users,
  Calendar,
  Sparkles,
  Lock,
  Globe,
  Link2,
  Loader2,
  RotateCcw,
  Download,
  History,
  Waypoints,
} from 'lucide-react';
import PageTransition from '@/components/motion/PageTransition';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ProgressRing from '@/components/ui/ProgressRing';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { StaggerList, StaggerItem } from '@/components/motion/StaggerList';
import {
  fetchProject,
  deleteProject,
  clearActive,
  selectActiveProject,
  selectActiveArtifacts,
  selectActiveDiagrams,
  selectDetailStatus,
} from '@/features/projects/projectSlice';
import { DIAGRAM_TYPE_LIST, diagramLabel } from '@/features/diagrams/diagramTypes';
import { projectApi } from '@/features/projects/projectApi';
import {
  startGeneration,
  generateAll,
  retryModule,
  cancelJob,
  clearJob,
  selectJob,
} from '@/features/generation/generationSlice';
import ModuleSelectorModal from '@/features/generation/ModuleSelectorModal';
import GenerationProgressPanel from '@/features/generation/GenerationProgressPanel';
import ExportModal from '@/features/projects/ExportModal';
import HistoryPanel from '@/features/projects/HistoryPanel';
import { useGenerationPolling } from '@/hooks/useGenerationPolling';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';
import { formatDate, titleCase, daysUntil } from '@/utils/format';
import { STATUS_STYLES, DOMAIN_GRADIENTS } from '@/utils/constants';
import { paths } from '@/routes/paths';

const MODULE_GROUPS = [
  { stage: 'Overview', modules: ['OVERVIEW', 'FEATURES', 'TECH_STACK'] },
  { stage: 'Analysis', modules: ['SRS', 'RISK_ANALYSIS', 'COST_ESTIMATION'] },
  { stage: 'Design', modules: ['DATABASE_DESIGN', 'API_DESIGN', 'FOLDER_STRUCTURE', 'UI_PLAN'] },
  { stage: 'Planning', modules: ['SPRINT_PLAN', 'ROADMAP'] },
  { stage: 'Delivery', modules: ['DOCUMENTATION', 'GITHUB_GUIDE', 'DEPLOYMENT_GUIDE'] },
  { stage: 'Submission', modules: ['VIVA_PREP'] },
];

const visibilityIcons = { private: Lock, unlisted: Link2, public: Globe };

const ProjectDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const project = useSelector(selectActiveProject);
  const artifacts = useSelector(selectActiveArtifacts);
  const diagrams = useSelector(selectActiveDiagrams);
  const detailStatus = useSelector(selectDetailStatus);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const storedJob = useSelector(selectJob(id));
  const job = useGenerationPolling(id, storedJob?.jobId);
  const isGenerating = Boolean(job && ['queued', 'running'].includes(job.overallStatus));

  useDocumentTitle(project?.title);

  useEffect(() => {
    dispatch(fetchProject(id));
    return () => {
      dispatch(clearActive());
      dispatch(clearJob(id));
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (project?.visibility) setVisibility(project.visibility);
  }, [project?.visibility]);

  // Once a job finishes (success, partial, or failure), the module cards need
  // the freshly generated artifacts — refetch the project rather than trying
  // to reshape job status payloads into artifact rows client-side.
  useEffect(() => {
    if (job && ['completed', 'partial', 'failed'].includes(job.overallStatus)) {
      dispatch(fetchProject(id));
      if (job.overallStatus === 'completed') toast.success('Generation complete');
      if (job.overallStatus === 'partial') toast('Some modules failed — check the panel below', { icon: '⚠️' });
      if (job.overallStatus === 'failed') toast.error('Generation failed');
    }
  }, [job?.overallStatus, dispatch, id]);

  const handleGenerateSelected = async (modules) => {
    setStarting(true);
    const result = await dispatch(startGeneration({ projectId: id, modules }));
    setStarting(false);
    if (startGeneration.fulfilled.match(result)) {
      setSelectorOpen(false);
      if (!result.payload.result.jobId) {
        toast('Everything selected is already up to date', { icon: 'ℹ️' });
      }
    } else {
      toast.error(result.payload?.message ?? 'Could not start generation');
    }
  };

  const handleGenerateAll = async () => {
    setStarting(true);
    const result = await dispatch(generateAll({ projectId: id }));
    setStarting(false);
    if (generateAll.fulfilled.match(result)) {
      if (!result.payload.result.jobId) {
        toast('Every module is already up to date', { icon: 'ℹ️' });
      }
    } else {
      toast.error(result.payload?.message ?? 'Could not start generation');
    }
  };

  const handleGenerateOne = async (type) => {
    const result = await dispatch(startGeneration({ projectId: id, modules: [type] }));
    if (!startGeneration.fulfilled.match(result)) {
      toast.error(result.payload?.message ?? 'Could not start generation');
    }
  };

  const handleRetryModule = async (type) => {
    const result = await dispatch(retryModule({ projectId: id, type }));
    if (!retryModule.fulfilled.match(result)) {
      toast.error(result.payload?.message ?? `Could not retry ${titleCase(type)}`);
    }
  };

  const handleCancel = async () => {
    if (!job?.jobId) return;
    setCancelling(true);
    await dispatch(cancelJob({ projectId: id, jobId: job.jobId }));
    setCancelling(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await dispatch(deleteProject(id));
    setDeleting(false);
    if (deleteProject.fulfilled.match(result)) {
      toast.success('Project deleted');
      navigate(paths.projects);
    }
  };

  const handleVisibility = async (next) => {
    setVisibility(next);
    try {
      await projectApi.setVisibility(id, next);
      toast.success(`Project is now ${next}`);
    } catch (error) {
      setVisibility(project.visibility);
      toast.error(error?.message ?? 'Could not change visibility');
    }
  };

  if (detailStatus === 'loading' || !project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const artifactByType = Object.fromEntries(artifacts.map((a) => [a.type, a]));
  const diagramByType = Object.fromEntries(diagrams.map((d) => [d.type, d]));
  const generatedCount = artifacts.filter((a) => a.status === 'completed').length;
  const percent = Math.round((generatedCount / 16) * 100);
  const remaining = daysUntil(project.deadline);
  const VisibilityIcon = visibilityIcons[visibility] ?? Lock;

  return (
    <PageTransition className="mx-auto max-w-6xl space-y-6">
      <Link to={paths.projects}>
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to projects
        </Button>
      </Link>

      <header className="relative overflow-hidden rounded-2xl border border-subtle">
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-25',
            DOMAIN_GRADIENTS[project.domain] ?? DOMAIN_GRADIENTS.other
          )}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6 bg-elevated/60 p-6 backdrop-blur-xl">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={STATUS_STYLES[project.status]} dot>
                {titleCase(project.status)}
              </Badge>
              <Badge variant="primary">{titleCase(project.domain)}</Badge>
              <Badge variant="accent">{titleCase(project.difficulty)}</Badge>
              {project.aiIntegrationRequired && (
                <Badge variant="info">
                  <Sparkles className="h-3 w-3" /> AI
                </Badge>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-content-primary sm:text-3xl">
              {project.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content-secondary">
              {project.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-content-muted">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {project.teamSize} {project.teamSize > 1 ? 'members' : 'member'}
              </span>
              {project.deadline && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5',
                    remaining < 0 ? 'text-danger' : remaining <= 7 ? 'text-warning' : ''
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(project.deadline)}
                  {remaining !== null && ` · ${remaining < 0 ? `${Math.abs(remaining)}d overdue` : `${remaining}d left`}`}
                </span>
              )}
            </div>

            {project.preferredTech?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.preferredTech.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-strong bg-base/40 px-2 py-0.5 font-mono text-xs text-content-secondary"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <ProgressRing value={percent} size={92} />
            <p className="text-xs text-content-muted">
              {generatedCount} of 16 modules
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Link to={paths.editProject(id)}>
          <Button variant="secondary" leftIcon={<Pencil className="h-4 w-4" />}>
            Edit
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <VisibilityIcon className="h-4 w-4 text-content-muted" />
          <Select
            value={visibility}
            onChange={(e) => handleVisibility(e.target.value)}
            className="h-9 w-36"
            options={[
              { value: 'private', label: 'Private' },
              { value: 'unlisted', label: 'Unlisted' },
              { value: 'public', label: 'Public' },
            ]}
          />
        </div>

        <Button
          onClick={() => setSelectorOpen(true)}
          disabled={isGenerating}
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          Generate modules
        </Button>

        <Button
          variant="secondary"
          onClick={() => setExportOpen(true)}
          disabled={generatedCount === 0}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Export
        </Button>

        <Button variant="ghost" onClick={() => setHistoryOpen(true)} leftIcon={<History className="h-4 w-4" />}>
          History
        </Button>

        <Button
          variant="ghost"
          className="ml-auto text-danger hover:bg-danger/10"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={() => setConfirmOpen(true)}
        >
          Delete
        </Button>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-content-primary">SDLC modules</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAll}
            loading={starting}
            disabled={isGenerating}
            leftIcon={<Sparkles className="h-3.5 w-3.5" />}
          >
            Generate all
          </Button>
        </div>

        {job && job.overallStatus !== 'idle' && (
          <GenerationProgressPanel
            job={job}
            onCancel={handleCancel}
            onRetryModule={handleRetryModule}
            cancelling={cancelling}
          />
        )}

        {MODULE_GROUPS.map((group) => (
          <div key={group.stage}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
              {group.stage}
            </h3>
            <StaggerList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.modules.map((type) => {
                const artifact = artifactByType[type];
                const done = artifact?.status === 'completed';
                const stale = artifact?.isStale;
                const liveStatus = job?.modules?.find((m) => m.type === type)?.status;
                const isQueued = liveStatus === 'queued';
                const isRunning = liveStatus === 'generating';
                const isFailed = liveStatus === 'failed';
                const clickable = !isQueued && !isRunning;

                const handleClick = () => {
                  if (isFailed) return handleRetryModule(type);
                  if (done) return navigate(paths.artifact(id, type));
                  if (!isGenerating) return handleGenerateOne(type);
                };

                return (
                  <StaggerItem key={type}>
                    <button
                      type="button"
                      onClick={handleClick}
                      disabled={!clickable}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition-all duration-300',
                        done
                          ? 'border-primary-500/30 bg-primary-500/5 hover:border-primary-500/60'
                          : 'border-dashed border-subtle bg-elevated/40 hover:border-primary-500/40',
                        (isQueued || isRunning) && 'cursor-wait opacity-80',
                        isFailed && 'border-danger/40 bg-danger/5'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-content-primary">
                          {titleCase(type)}
                        </p>
                        {isRunning ? (
                          <Badge variant="info" dot>
                            <Loader2 className="h-3 w-3 animate-spin" /> Generating
                          </Badge>
                        ) : isQueued ? (
                          <Badge dot>Queued</Badge>
                        ) : isFailed ? (
                          <Badge variant="danger" dot>
                            <RotateCcw className="h-3 w-3" /> Retry
                          </Badge>
                        ) : done ? (
                          <Badge variant={stale ? 'warning' : 'success'} dot>
                            {stale ? 'Stale' : 'Ready'}
                          </Badge>
                        ) : (
                          <Badge>Not generated</Badge>
                        )}
                      </div>
                      {done && artifact.version > 1 && (
                        <p className="mt-2 font-mono text-xs text-content-muted">
                          v{artifact.version}
                        </p>
                      )}
                      {!done && !isQueued && !isRunning && !isFailed && (
                        <p className="mt-2 text-xs text-content-muted">Click to generate</p>
                      )}
                    </button>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-content-primary">Diagrams</h2>
          <p className="text-xs text-content-muted">
            ER and UML diagrams, generated as Mermaid source and rendered in your browser.
          </p>
        </div>

        <StaggerList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DIAGRAM_TYPE_LIST.map((type) => {
            const diagram = diagramByType[type];
            const done = diagram?.status === 'completed';
            const failed = diagram?.status === 'failed';

            return (
              <StaggerItem key={type}>
                <Link
                  to={paths.diagram(id, type)}
                  className={cn(
                    'block w-full rounded-xl border p-4 text-left transition-all duration-300',
                    done
                      ? 'border-primary-500/30 bg-primary-500/5 hover:border-primary-500/60'
                      : 'border-dashed border-subtle bg-elevated/40 hover:border-primary-500/40',
                    failed && 'border-danger/40 bg-danger/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-content-primary">
                      <Waypoints className="h-3.5 w-3.5 text-primary-400" />
                      {diagramLabel(type)}
                    </p>
                    {failed ? (
                      <Badge variant="danger" dot>
                        <RotateCcw className="h-3 w-3" /> Retry
                      </Badge>
                    ) : done ? (
                      <Badge variant="success" dot>
                        Ready
                      </Badge>
                    ) : (
                      <Badge>Not generated</Badge>
                    )}
                  </div>
                  {done && diagram.version > 1 && (
                    <p className="mt-2 font-mono text-xs text-content-muted">v{diagram.version}</p>
                  )}
                  {!done && !failed && <p className="mt-2 text-xs text-content-muted">Click to generate</p>}
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${project.title}"?`}
        description="It will be recoverable for 30 days before being permanently removed."
        confirmLabel="Delete project"
      />

      <ModuleSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onGenerate={handleGenerateSelected}
        generatedTypes={artifacts.map((a) => a.type)}
        submitting={starting}
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        projectId={id}
        generatedTypes={artifacts.filter((a) => a.status === 'completed').map((a) => a.type)}
      />

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Project history" size="lg">
        {historyOpen && <HistoryPanel projectId={id} />}
      </Modal>
    </PageTransition>
  );
};

export default ProjectDetailPage;
