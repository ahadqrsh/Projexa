import ParticleField from '@/components/three/ParticleField';

const LoadingScreen = ({ message = 'Preparing your workspace' }) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base">
    <div className="absolute inset-0 opacity-60">
      <ParticleField count={60} interactive={false} />
    </div>
    <div className="relative flex flex-col items-center gap-5">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-500 blur-md" />
        <div className="absolute inset-[3px] flex items-center justify-center rounded-xl bg-base font-mono text-lg font-bold text-gradient">
          AI
        </div>
      </div>
      <p className="animate-pulse-soft text-sm text-content-secondary">{message}</p>
    </div>
  </div>
);

export default LoadingScreen;
