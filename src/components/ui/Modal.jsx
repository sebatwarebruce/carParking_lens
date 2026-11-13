import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { clsx } from '@/utils/format.js';

/** Native <dialog>: built-in focus trap, Escape to close, inert background. variant 'sheet' slides up on phones. */
export default function Modal({ open, onClose, title, description, variant = 'dialog', children, footer, dismissible = true }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      className={clsx('modal', variant === 'sheet' ? 'is-sheet' : 'is-dialog')}
      onCancel={(e) => { e.preventDefault(); if (dismissible) onClose?.(); }}
      onClick={(e) => { if (dismissible && e.target === ref.current) onClose?.(); }}
      onClose={() => { if (open) onClose?.(); }}
    >
      {open && (
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 id="modal-title" className="font-display text-xl">{title}</h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            {dismissible && <button onClick={onClose} aria-label="Close" className="-m-2 grid size-11 place-items-center rounded-md text-muted hover:bg-surface2"><X size={20} /></button>}
          </div>
          {children}
          {footer && <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
