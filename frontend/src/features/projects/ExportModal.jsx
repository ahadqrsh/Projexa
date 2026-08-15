import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, FileType, FileCode, Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { titleCase } from '@/utils/format';
import { projectApi } from './projectApi';

const FORMATS = [
  { value: 'pdf', label: 'PDF', icon: FileText, hint: 'Best for printing and submission' },
  { value: 'docx', label: 'Word', icon: FileType, hint: 'Editable .docx document' },
  { value: 'md', label: 'Markdown', icon: FileCode, hint: 'Plain text, great for GitHub' },
];

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const ExportModal = ({ open, onClose, projectId, generatedTypes = [] }) => {
  const [format, setFormat] = useState('pdf');
  const [selected, setSelected] = useState([]);
  const [downloading, setDownloading] = useState(false);

  const toggle = (type) => {
    setSelected((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { blob, filename } = await projectApi.export(projectId, {
        format,
        modules: selected.length ? selected : undefined,
      });
      triggerDownload(blob, filename);
      toast.success('Export downloaded');
      onClose();
    } catch (error) {
      // The server sends a JSON error body for failed exports, not a blob — but
      // axios still hands it back as a Blob because responseType was 'blob'.
      let message = 'Could not export this project';
      if (error?.raw instanceof Blob) {
        try {
          message = JSON.parse(await error.raw.text())?.message ?? message;
        } catch {
          /* fall through to the default message */
        }
      }
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export project"
      description="Download the generated SDLC plan as a single document."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={downloading}>
            Cancel
          </Button>
          <Button onClick={handleDownload} loading={downloading} leftIcon={<Download className="h-4 w-4" />}>
            Download
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Format</h3>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map(({ value, label, icon: Icon, hint }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormat(value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors',
                  format === value
                    ? 'border-primary-500 bg-primary-500/10 text-content-primary'
                    : 'border-strong text-content-secondary hover:border-primary-500/50'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-[11px] leading-tight text-content-muted">{hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
            Modules {selected.length === 0 && '(all generated modules)'}
          </h3>
          {generatedTypes.length === 0 ? (
            <p className="text-sm text-content-muted">No modules have been generated yet.</p>
          ) : (
            <div className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
              {generatedTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggle(type)}
                  className={cn(
                    'rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors',
                    selected.includes(type)
                      ? 'border-primary-500 bg-primary-500/10 text-content-primary'
                      : 'border-strong text-content-secondary hover:border-primary-500/50'
                  )}
                >
                  {titleCase(type)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
