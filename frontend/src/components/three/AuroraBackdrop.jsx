import { cn } from '@/utils/cn';

const AuroraBackdrop = ({ className, showGrid = true }) => (
  <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
    {showGrid && <div className="grid-bg absolute inset-0 opacity-40" />}

    <div className="animate-float absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary-500/25 blur-[110px]" />
    <div
      className="animate-float absolute -right-24 top-1/4 h-[24rem] w-[24rem] rounded-full bg-accent-500/20 blur-[110px]"
      style={{ animationDelay: '2s' }}
    />
    <div
      className="animate-float absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-cyber-500/15 blur-[100px]"
      style={{ animationDelay: '4s' }}
    />
  </div>
);

export default AuroraBackdrop;
