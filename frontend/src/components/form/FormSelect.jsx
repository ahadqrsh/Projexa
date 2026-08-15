import FormField from './FormField';
import Select from '@/components/ui/Select';
import { titleCase } from '@/utils/format';

const FormSelect = ({ label, name, register, error, hint, required, options = [], ...props }) => (
  <FormField label={label} name={name} error={error} hint={hint} required={required}>
    <Select
      id={name}
      error={error}
      options={options.map((o) =>
        typeof o === 'string' ? { value: o, label: titleCase(o) } : o
      )}
      aria-describedby={error ? `${name}-error` : undefined}
      {...(register ? register(name) : {})}
      {...props}
    />
  </FormField>
);

export default FormSelect;
