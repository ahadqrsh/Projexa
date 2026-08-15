import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FolderKanban, Zap, TrendingUp, CheckCircle2, Plus, ArrowRight } from 'lucide-react';
import PageTransition from '@/components/motion/PageTransition';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard, SkeletonStat } from '@/components/ui/Skeleton';
import ProjectCard from '@/features/projects/ProjectCard';
import { StaggerList, StaggerItem } from '@/components/motion/StaggerList';
import {
  fetchProjects,
  fetchProjectStats,
  selectProjects,
  selectProjectStats,
  selectListStatus,
} from '@/features/projects/projectSlice';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const DashboardPage = () => {
  useDocumentTitle('Dashboard');
  const dispatch = useDispatch();
  const { user } = useAuth();
  const projects = useSelector(selectProjects);
  const stats = useSelector(selectProjectStats);
  const listStatus = useSelector(selectListStatus);

  useEffect(() => {
    dispatch(fetchProjectStats());
    dispatch(fetchProjects({ limit: 6, sort: '-updatedAt' }));
  }, [dispatch]);

  const loading = listStatus === 'loading' && projects.length === 0;
  const continueProject = projects.find((p) => p.status !== 'completed') ?? projects[0];

  return (
    <PageTransition className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary sm:text-3xl">
            {greeting()}, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-content-secondary">
            Here is where your projects stand today.
          </p>
        </div>
        <Link to={paths.newProject}>
          <Button leftIcon={<Plus className="h-4 w-4" />}>New project</Button>
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <StatCard
              label="Projects"
              value={stats.projects.total}
              icon={<FolderKanban className="h-5 w-5" />}
              accent="primary"
              delay={0}
            />
            <StatCard
              label="Active"
              value={stats.projects.active}
              icon={<TrendingUp className="h-5 w-5" />}
              accent="accent"
              delay={0.05}
            />
            <StatCard
              label="AI Credits"
              value={stats.credits.remaining}
              trend={`of ${stats.credits.limit} remaining`}
              icon={<Zap className="h-5 w-5" />}
              accent="cyber"
              delay={0.1}
            />
            <StatCard
              label="Avg. progress"
              value={`${stats.projects.averageCompletion}%`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              accent="success"
              delay={0.15}
            />
          </>
        )}
      </section>

      {continueProject && (
        <section className="glow-border rounded-xl border border-subtle bg-elevated/70 p-5 backdrop-blur-xl">
          <p className="text-xs font-medium uppercase tracking-wider text-content-muted">
            Continue where you left off
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-content-primary">
                {continueProject.title}
              </h2>
              <div className="mt-2 max-w-md">
                <ProgressBar
                  value={Math.round(((continueProject.generatedModules?.length ?? 0) / 16) * 100)}
                  showLabel
                />
              </div>
            </div>
            <Link to={paths.project(continueProject._id)}>
              <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Continue
              </Button>
            </Link>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-content-primary">Recent projects</h2>
          <Link
            to={paths.projects}
            className="text-sm font-medium text-primary-400 transition-colors hover:text-primary-500"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-7 w-7" />}
            title="No projects yet"
            description="Create your first project and turn a one-line idea into a complete SDLC plan."
            action={
              <Link to={paths.newProject}>
                <Button leftIcon={<Plus className="h-4 w-4" />}>Create your first project</Button>
              </Link>
            }
          />
        ) : (
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <StaggerItem key={project._id}>
                <ProjectCard project={project} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>
    </PageTransition>
  );
};

export default DashboardPage;
