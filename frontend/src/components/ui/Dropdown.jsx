import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

const Dropdown = ({ trigger, children, align = 'right', className }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className={cn(
              'absolute z-40 mt-2 min-w-[12rem] overflow-hidden rounded-xl',
              'border border-strong bg-elevated p-1.5 shadow-lifted',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DropdownItem = ({ children, icon, danger = false, className, ...props }) => (
  <button
    type="button"
    className={cn(
      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm',
      'transition-colors duration-150',
      danger
        ? 'text-danger hover:bg-danger/10'
        : 'text-content-secondary hover:bg-surface hover:text-content-primary',
      className
    )}
    {...props}
  >
    {icon}
    {children}
  </button>
);

export const DropdownDivider = () => <div className="my-1.5 h-px bg-subtle" />;

export default Dropdown;
