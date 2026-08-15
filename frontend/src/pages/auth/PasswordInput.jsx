import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import FormField from '@/components/form/FormField';
import Input from '@/components/ui/Input';

const PasswordInput = ({ label, name, register, error, hint, leftIcon, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <FormField label={label} name={name} error={error} hint={hint}>
      <Input
        id={name}
        type={visible ? 'text' : 'password'}
        error={error}
        leftIcon={leftIcon}
        aria-describedby={error ? `${name}-error` : undefined}
        rightElement={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="rounded-md p-1.5 text-content-muted transition-colors hover:text-content-primary"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...(register ? register(name) : {})}
        {...props}
      />
    </FormField>
  );
};

export default PasswordInput;
