import { cn } from '@/utils/cn';

const FormField = ({ label, name, error, hint, required, children, className }) => (
  <div className={cn('space-y-1.5', className)}>
    {label && (
      <label htmlFor={name} className="block text-sm font-medium text-content-primary">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p id={`${name}-error`} role="alert" className="text-xs text-danger">
        {error}
      </p>
    ) : (
      hint && <p className="text-xs text-content-muted">{hint}</p>
    )}
  </div>
);

export default FormField;
