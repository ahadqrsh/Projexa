import { useEffect, useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { api } from '@/services/axiosInstance';
import { endpoints } from '@/services/endpoints';
import { unwrap } from '@/services/interceptors';
import { titleCase } from '@/utils/format';
import { cn } from '@/utils/cn';

/**
 * Fetched from the backend rather than hard-coded, on purpose. The backend's
 * /meta/constants endpoint exists precisely so that adding a new generator
 * (Phase 6) never requires a frontend redeploy just to unlock its checkbox here.
 */
const useImplementedModules = () => {
  const [state, setState] = useState({ groups: null, implemented: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    api
      .get(endpoints.meta.constants)
      .then((res) => {
        if (cancelled) return;
        const data = unwrap(res);
        setState({ groups: data.artifactGroups, implemented: data.implementedModules, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};

const ModuleSelectorModal = ({ open, onClose, onGenerate, generatedTypes = [], submitting }) => {
  const { groups, implemented, loading } = useImplementedModules();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  const toggle = (type) => {
    setSelected((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const selectAll = () => setSelected(implemented);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate modules"
      description="Pick what to generate. Modules that read another module's output run after it automatically."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={selectAll}
            disabled={submitting || loading}
          >
            Select all
          </Button>
          <Button
            onClick={() => onGenerate(selected)}
            disabled={selected.length === 0 || submitting}
            loading={submitting}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            Generate {selected.length > 0 ? `${selected.length} module${selected.length > 1 ? 's' : ''}` : ''}
          </Button>
        </>
      }
    >
      {loading ? (
        <p className="py-8 text-center text-sm text-content-secondary">Loading available modules…</p>
      ) : (
        <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1">
          {groups &&
            Object.entries(groups).map(([stage, types]) => {
              const availableTypes = types.filter((t) => implemented.includes(t));
              if (availableTypes.length === 0) return null;

              return (
                <div key={stage}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
                    {titleCase(stage)}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableTypes.map((type) => {
                      const alreadyGenerated = generatedTypes.includes(type);
                      const checked = selected.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggle(type)}
                          className={cn(
                            'flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                            checked
                              ? 'border-primary-500 bg-primary-500/10 text-content-primary'
                              : 'border-strong text-content-secondary hover:border-primary-500/50'
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                                checked ? 'border-primary-500 bg-primary-500' : 'border-strong'
                              )}
                            >
                              {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                            {titleCase(type)}
                          </span>
                          {alreadyGenerated && (
                            <Badge variant="warning" className="shrink-0">
                              Regenerate
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          <div className="flex items-start gap-2.5 rounded-lg border border-primary-500/25 bg-primary-500/10 p-3">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-400" />
            <p className="text-xs text-content-secondary">
              Each module costs 1 AI credit. Regenerating an already-generated module archives
              its previous version — nothing is lost.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ModuleSelectorModal;
