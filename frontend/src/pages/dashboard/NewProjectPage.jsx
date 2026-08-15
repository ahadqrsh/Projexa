import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import PageTransition from '@/components/motion/PageTransition';
import Button from '@/components/ui/Button';
import IdeaWizard from '@/features/projects/IdeaWizard';
import { createProject, selectMutationStatus } from '@/features/projects/projectSlice';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const NewProjectPage = () => {
  useDocumentTitle('New project');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectMutationStatus);

  const handleSubmit = async (values) => {
    const payload = { ...values };
    if (!payload.deadline) delete payload.deadline;

    const result = await dispatch(createProject(payload));
    if (createProject.fulfilled.match(result)) {
      toast.success('Project created');
      navigate(paths.project(result.payload._id));
    } else {
      const error = result.payload;
      toast.error(error?.errors?.[0]?.message ?? error?.message ?? 'Could not create the project');
    }
  };

  return (
    <PageTransition className="mx-auto max-w-3xl">
      <Link to={paths.projects}>
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-4">
          Back to projects
        </Button>
      </Link>

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-content-primary sm:text-3xl">
          Describe your <span className="text-gradient">project idea</span>
        </h1>
        <p className="mt-2 text-sm text-content-secondary">
          Four short steps. Everything here feeds the AI that builds your SDLC plan.
        </p>
      </div>

      <div className="rounded-2xl border border-subtle bg-elevated/70 p-5 backdrop-blur-xl sm:p-7">
        <IdeaWizard onSubmit={handleSubmit} submitting={status === 'loading'} />
      </div>
    </PageTransition>
  );
};

export default NewProjectPage;
