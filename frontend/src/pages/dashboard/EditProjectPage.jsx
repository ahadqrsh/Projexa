import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import PageTransition from '@/components/motion/PageTransition';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import IdeaWizard from '@/features/projects/IdeaWizard';
import {
  fetchProject,
  updateProject,
  clearActive,
  selectActiveProject,
  selectDetailStatus,
  selectMutationStatus,
} from '@/features/projects/projectSlice';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const EditProjectPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const project = useSelector(selectActiveProject);
  const detailStatus = useSelector(selectDetailStatus);
  const mutationStatus = useSelector(selectMutationStatus);

  useDocumentTitle(project ? `Edit ${project.title}` : 'Edit project');

  useEffect(() => {
    dispatch(fetchProject(id));
    return () => dispatch(clearActive());
  }, [dispatch, id]);

  const handleSubmit = async (values) => {
    const payload = { ...values };
    if (!payload.deadline) delete payload.deadline;

    const result = await dispatch(updateProject({ id, payload }));
    if (updateProject.fulfilled.match(result)) {
      const { ideaChanged, staleArtifactCount } = result.payload;
      toast.success(
        ideaChanged && staleArtifactCount
          ? `Saved. ${staleArtifactCount} generated module(s) are now out of date.`
          : 'Project updated'
      );
      navigate(paths.project(id));
    } else {
      toast.error(result.payload?.message ?? 'Could not save your changes');
    }
  };

  if (detailStatus === 'loading' || !project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-3xl">
      <Link to={paths.project(id)}>
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-4">
          Back to project
        </Button>
      </Link>

      <h1 className="text-2xl font-bold text-content-primary">Edit project</h1>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/10 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <p className="text-xs leading-relaxed text-content-secondary">
          Changing the title, description, domain, difficulty, team size or preferred stack marks
          every generated module as out of date. Nothing is deleted — you choose when to regenerate.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-subtle bg-elevated/70 p-5 backdrop-blur-xl sm:p-7">
        <IdeaWizard
          mode="edit"
          submitting={mutationStatus === 'loading'}
          onSubmit={handleSubmit}
          defaultValues={{
            title: project.title,
            description: project.description,
            domain: project.domain,
            difficulty: project.difficulty,
            projectType: project.projectType ?? 'web',
            teamSize: project.teamSize ?? 1,
            preferredTech: project.preferredTech ?? [],
            tags: project.tags ?? [],
            deadline: project.deadline ? project.deadline.slice(0, 10) : '',
            aiIntegrationRequired: Boolean(project.aiIntegrationRequired),
          }}
        />
      </div>
    </PageTransition>
  );
};

export default EditProjectPage;
