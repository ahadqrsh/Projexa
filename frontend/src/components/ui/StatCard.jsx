import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import TiltCard from '@/components/three/TiltCard';

const StatCard = ({ label, value, icon, trend, accent = 'primary', delay = 0 }) => {
  const accents = {
    primary: 'from-primary-500/20 to-primary-500/0 text-primary-400',
    accent: 'from-accent-500/20 to-accent-500/0 text-accent-400',
    cyber: 'from-cyber-500/20 to-cyber-500/0 text-cyber-400',
    success: 'from-success/20 to-success/0 text-success',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <TiltCard maxTilt={7}>
        <div className="glow-border relative overflow-hidden rounded-xl border border-subtle bg-elevated/70 p-5 backdrop-blur-xl">
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-70',
              accents[accent].split(' ').slice(0, 2).join(' ')
            )}
          />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-content-muted">
                {label}
              </p>
              <p className="mt-2 font-mono text-3xl font-bold text-gradient">{value}</p>
              {trend && <p className="mt-1 text-xs text-content-secondary">{trend}</p>}
            </div>
            {icon && (
              <div className={cn('tilt-layer rounded-lg bg-base/40 p-2.5', accents[accent].split(' ').pop())}>
                {icon}
              </div>
            )}
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
};

export default StatCard;
