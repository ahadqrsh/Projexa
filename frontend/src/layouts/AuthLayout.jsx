import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import ParticleField from '@/components/three/ParticleField';
import AuroraBackdrop from '@/components/three/AuroraBackdrop';
import Logo from '@/components/ui/Logo';
import { paths } from '@/routes/paths';

const highlights = [
  'Turn one idea into a full SDLC plan',
  'SRS, database design and API contracts',
  'Sprint roadmap and viva preparation',
];

const AuthLayout = () => (
  <div className="flex min-h-screen">
    <div className="relative hidden w-1/2 overflow-hidden border-r border-subtle bg-surface lg:block">
      <AuroraBackdrop />
      <div className="absolute inset-0">
        <ParticleField count={80} connectionDistance={140} />
      </div>

      <div className="relative flex h-full flex-col justify-between p-12">
        <Link to={paths.landing} className="inline-flex items-center gap-2.5">
          <Logo size={40} />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-md"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-400">
            <Sparkles className="h-3 w-3" />
            Your virtual software architect
          </span>

          <h2 className="mt-5 text-4xl font-bold leading-tight text-content-primary">
            From a single idea to a{' '}
            <span className="text-gradient">complete project plan</span>
          </h2>

          <ul className="mt-7 space-y-3">
            {highlights.map((item, index) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 text-sm text-content-secondary"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500" />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <p className="text-xs text-content-muted">
          Final Year Project · MERN + Gemini
        </p>
      </div>
    </div>

    <div className="relative flex w-full items-center justify-center px-5 py-12 lg:w-1/2">
      <AuroraBackdrop className="lg:hidden" showGrid={false} />
      <div className="relative w-full max-w-md">
        <Link to={paths.landing} className="mb-8 inline-flex items-center gap-2.5 lg:hidden">
          <Logo size={36} />
        </Link>
        <Outlet />
      </div>
    </div>
  </div>
);

export default AuthLayout;
