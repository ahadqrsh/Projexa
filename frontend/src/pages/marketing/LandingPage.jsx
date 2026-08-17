import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Database,
  Route as RouteIcon,
  Calendar,
  Layers,
  MessageSquareQuote,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import TiltCard from '@/components/three/TiltCard';
import ParticleField from '@/components/three/ParticleField';
import AuroraBackdrop from '@/components/three/AuroraBackdrop';
import { StaggerList, StaggerItem } from '@/components/motion/StaggerList';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const capabilities = [
  { icon: FileText, title: 'SRS generation', body: 'Functional and non-functional requirements, each with a measurable acceptance metric.' },
  { icon: Database, title: 'Database design', body: 'Collections, fields, relationships and an ER diagram derived from your feature set.' },
  { icon: RouteIcon, title: 'API contracts', body: 'REST endpoints with request and response examples that match your schema.' },
  { icon: Layers, title: 'Folder structure', body: 'A scalable frontend and backend layout with the reasoning behind each directory.' },
  { icon: Calendar, title: 'Weekly roadmap', body: 'Your deadline broken into sprints and trackable tasks.' },
  { icon: MessageSquareQuote, title: 'Viva preparation', body: 'Technical, conceptual and project-specific questions with model answers.' },
];

const LandingPage = () => {
  useDocumentTitle();
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-base">
      <AuroraBackdrop />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
        <Link to={paths.landing} className="flex items-center gap-2.5">
          <Logo size={36} />
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to={paths.dashboard}>
              <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to={paths.login}>
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to={paths.register}>
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-12 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3.5 py-1.5 text-xs font-medium text-primary-400">
              <Sparkles className="h-3.5 w-3.5" />
              Your virtual software architect
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] text-content-primary sm:text-5xl lg:text-6xl">
              One idea in.
              <br />
              <span className="text-gradient">A whole project out.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-content-secondary">
              Describe your final-year project in a sentence. Get an SRS, database design, API
              contracts, folder structure, sprint roadmap and viva questions — all consistent with
              each other, all exportable.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={isAuthenticated ? paths.dashboard : paths.register}>
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  {isAuthenticated ? 'Open dashboard' : 'Start building free'}
                </Button>
              </Link>
              <Link to={paths.login}>
                <Button size="lg" variant="glass">
                  Sign in
                </Button>
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {[
                ['16', 'SDLC modules'],
                ['4', 'UML diagrams'],
                ['1', 'exportable report'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-mono text-2xl font-bold text-gradient">{value}</dt>
                  <dd className="mt-0.5 text-xs text-content-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="relative hidden h-[28rem] lg:block"
          >
            <ParticleField count={110} connectionDistance={125} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="animate-float rounded-2xl border border-primary-500/25 bg-base/50 px-5 py-3 backdrop-blur-xl">
                <p className="font-mono text-xs text-content-muted">idea</p>
                <p className="text-sm font-semibold text-content-primary">
                  &ldquo;Hospital management system&rdquo;
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-28">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-content-primary sm:text-4xl">
            Everything a final-year project needs
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-content-secondary">
            Not sixteen disconnected documents. Each module is generated with the previous ones as
            context, so the API design actually matches the database schema.
          </p>
        </div>

        <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <TiltCard maxTilt={8}>
                <div className="glow-border h-full rounded-2xl border border-subtle bg-elevated/60 p-6 backdrop-blur-xl">
                  <div className="tilt-layer inline-flex rounded-xl border border-primary-500/25 bg-primary-500/10 p-3 text-primary-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-content-primary">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-content-secondary">{body}</p>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-5 pb-28">
        <div className="glow-border relative overflow-hidden rounded-3xl border border-subtle bg-elevated/60 p-10 text-center backdrop-blur-xl sm:p-14">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-content-primary sm:text-4xl">
              Stop staring at a blank document
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-content-secondary">
              Go from idea to a defensible project plan in minutes, not weekends.
            </p>
            <Link to={isAuthenticated ? paths.dashboard : paths.register}>
              <Button size="lg" className="mt-8" rightIcon={<ArrowRight className="h-4 w-4" />}>
                {isAuthenticated ? 'Open dashboard' : 'Create your first project'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-subtle py-8 text-center text-xs text-content-muted">
        Projexa · Final Year Computer Science Project · MERN + Gemini
      </footer>
    </div>
  );
};

export default LandingPage;
