import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const ForbiddenPage = () => {
  useDocumentTitle('Access denied');

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
          <ShieldX className="h-7 w-7" />
        </div>
        <p className="mt-6 font-mono text-5xl font-extrabold text-gradient">403</p>
        <h1 className="mt-3 text-2xl font-bold text-content-primary">Access denied</h1>
        <p className="mt-2 max-w-sm text-sm text-content-secondary">
          Your account does not have permission to view this page.
        </p>
        <Link to={paths.dashboard}>
          <Button className="mt-8" leftIcon={<Home className="h-4 w-4" />}>
            Back to dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default ForbiddenPage;
