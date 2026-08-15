import FormField from './FormField';
import Textarea from '@/components/ui/Textarea';

const FormTextarea = ({ label, name, register, error, hint, required, ...props }) => (
  <FormField label={label} name={name} error={error} hint={hint} required={required}>
    <Textarea
      id={name}
      error={error}
      aria-describedby={error ? `${name}-error` : undefined}
      {...(register ? register(name) : {})}
      {...props}
    />
  </FormField>
);

export default FormTextarea;
