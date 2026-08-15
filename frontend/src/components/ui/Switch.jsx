import { cn } from '@/utils/cn';

const Switch = ({ checked, onChange, label, description, disabled }) => (
  <label className={cn('flex items-start gap-4', disabled ? 'opacity-60' : 'cursor-pointer')}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
        checked ? 'bg-gradient-to-r from-primary-600 to-accent-600' : 'bg-strong'
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ease-smooth',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
    {(label || description) && (
      <span>
        {label && <span className="block text-sm font-medium text-content-primary">{label}</span>}
        {description && (
          <span className="block text-xs text-content-secondary">{description}</span>
        )}
      </span>
    )}
  </label>
);

export default Switch;
