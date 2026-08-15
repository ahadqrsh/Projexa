import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, SearchX } from 'lucide-react';
import PageTransition from '@/components/motion/PageTransition';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ProjectCard from '@/features/projects/ProjectCard';
import ProjectFilters from '@/features/projects/ProjectFilters';
import { StaggerList, StaggerItem } from '@/components/motion/StaggerList';
import {
  fetchProjects,
  deleteProject,
  duplicateProject,
  setPage,
  selectProjects,
  selectProjectMeta,
  selectProjectFilters,
  selectListStatus,
} from '@/features/projects/projectSlice';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const ProjectsPage = () => {
  useDocumentTitle('My Projects');
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const meta = useSelector(selectProjectMeta);
  const filters = useSelector(selectProjectFilters);
  const listStatus = useSelector(selectListStatus);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch, filters, meta.page]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await dispatch(deleteProject(pendingDelete._id));
    setDeleting(false);
    setPendingDelete(null);

    if (deleteProject.fulfilled.match(result)) {
      toast.success('Project deleted. You can restore it within 30 days.');
    } else {
      toast.error(result.payload?.message ?? 'Could not delete the project');
    }
  };

  const handleDuplicate = async (id) => {
    const result = await dispatch(duplicateProject(id));
    if (duplicateProject.fulfilled.match(result)) toast.success('Project duplicated');
  };

  const loading = listStatus === 'loading';
  const hasFilters = Boolean(filters.search || filters.status || filters.domain || filters.difficulty);

  return (
    <PageTransition className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">My Projects</h1>
          <p className="mt-1 text-sm text-content-secondary">
            {meta.total} {meta.total === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <Link to={paths.newProject}>
          <Button leftIcon={<Plus className="h-4 w-4" />}>New project</Button>
        </Link>
      </header>

      <ProjectFilters />

      {loading && projects.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={hasFilters ? <SearchX className="h-7 w-7" /> : <FolderKanban className="h-7 w-7" />}
          title={hasFilters ? 'No projects match these filters' : 'No projects yet'}
          description={
            hasFilters
              ? 'Try widening your search or clearing the filters.'
              : 'Create your first project and turn a one-line idea into a complete SDLC plan.'
          }
          action={
            !hasFilters && (
              <Link to={paths.newProject}>
                <Button leftIcon={<Plus className="h-4 w-4" />}>Create your first project</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <StaggerItem key={project._id}>
                <ProjectCard
                  project={project}
                  onDelete={setPendingDelete}
                  onDuplicate={handleDuplicate}
                />
              </StaggerItem>
            ))}
          </StaggerList>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onChange={(page) => {
              dispatch(setPage(page));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="pt-4"
          />
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${pendingDelete?.title ?? ''}"?`}
        description="It will be recoverable for 30 days before being permanently removed."
        confirmLabel="Delete project"
      />
    </PageTransition>
  );
};

export default ProjectsPage;
