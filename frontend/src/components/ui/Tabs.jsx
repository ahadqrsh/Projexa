import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

const Tabs = ({ tabs = [], value, onChange, className }) => (
  <div className={cn('flex gap-1 rounded-xl border border-subtle bg-surface p-1', className)}>
    {tabs.map((tab) => {
      const key = typeof tab === 'string' ? tab : tab.value;
      const label = typeof tab === 'string' ? tab : tab.label;
      const active = key === value;

      return (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            active ? 'text-white' : 'text-content-secondary hover:text-content-primary'
          )}
        >
          {active && (
            <motion.span
              layoutId="tab-indicator"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600"
            />
          )}
          <span className="relative z-10">{label}</span>
        </button>
      );
    })}
  </div>
);

export default Tabs;
