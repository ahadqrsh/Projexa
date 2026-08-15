import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

const Modal = ({ open, onClose, title, description, children, footer, size = 'md', className }) => {
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    triggerRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);

    const focusTimer = setTimeout(() => panelRef.current?.focus(), 40);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(focusTimer);
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'relative w-full rounded-2xl border border-strong bg-elevated shadow-lifted outline-none',
              sizes[size],
              className
            )}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 border-b border-subtle p-5">
                <div>
                  {title && <h2 className="text-lg font-semibold text-content-primary">{title}</h2>}
                  {description && (
                    <p className="mt-1 text-sm text-content-secondary">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="rounded-md p-1.5 text-content-muted transition-colors hover:bg-surface hover:text-content-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
            {footer && (
              <div className="flex justify-end gap-3 border-t border-subtle p-5">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
