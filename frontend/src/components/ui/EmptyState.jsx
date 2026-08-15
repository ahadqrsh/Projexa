import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

const EmptyState = ({ icon, title, description, action, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}
  >
    {icon && (
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-2xl bg-primary-500/20 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-subtle bg-elevated text-primary-400">
          {icon}
        </div>
      </div>
    )}
    <h3 className="text-lg font-semibold text-content-primary">{title}</h3>
    {description && (
      <p className="mt-2 max-w-sm text-sm text-content-secondary">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </motion.div>
);

export default EmptyState;
