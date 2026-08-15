import FormField from './FormField';
import Input from '@/components/ui/Input';

const FormInput = ({ label, name, register, error, hint, required, ...props }) => (
  <FormField label={label} name={name} error={error} hint={hint} required={required}>
    <Input
      id={name}
      error={error}
      aria-describedby={error ? `${name}-error` : undefined}
      {...(register ? register(name) : {})}
      {...props}
    />
  </FormField>
);

export default FormInput;
