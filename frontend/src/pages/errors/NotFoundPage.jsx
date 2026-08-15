import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import ParticleField from '@/components/three/ParticleField';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const NotFoundPage = () => {
  useDocumentTitle('Page not found');

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-5">
      <div className="absolute inset-0 opacity-50">
        <ParticleField count={70} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center"
      >
        <p className="font-mono text-7xl font-extrabold text-gradient sm:text-8xl">404</p>
        <h1 className="mt-4 text-2xl font-bold text-content-primary">This page does not exist</h1>
        <p className="mt-2 max-w-sm text-sm text-content-secondary">
          The link may be broken, or the project may have been deleted.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="ghost" onClick={() => window.history.back()} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Go back
          </Button>
          <Link to={paths.dashboard}>
            <Button leftIcon={<Home className="h-4 w-4" />}>Dashboard</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
