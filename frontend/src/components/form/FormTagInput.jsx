import { useState } from 'react';
import { X } from 'lucide-react';
import FormField from './FormField';
import { cn } from '@/utils/cn';

const FormTagInput = ({
  label,
  name,
  value = [],
  onChange,
  error,
  hint,
  placeholder = 'Type and press Enter',
  max = 25,
}) => {
  const [draft, setDraft] = useState('');

  const addTag = (raw) => {
    const tag = raw.trim().replace(/,$/, '');
    if (!tag || value.length >= max) return;
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
    setDraft('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <FormField label={label} name={name} error={error} hint={hint}>
      <div
        className={cn(
          'flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-lg border bg-surface p-2',
          'transition-all duration-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/25',
          error ? 'border-danger' : 'border-strong'
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md border border-primary-500/30 bg-primary-500/15 px-2 py-1 text-xs font-medium text-primary-400"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="transition-colors hover:text-danger"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={name}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={value.length >= max ? `Limit of ${max} reached` : placeholder}
          disabled={value.length >= max}
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 text-sm text-content-primary outline-none placeholder:text-content-muted"
        />
      </div>
    </FormField>
  );
};

export default FormTagInput;
