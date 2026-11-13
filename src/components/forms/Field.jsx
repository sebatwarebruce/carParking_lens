import { forwardRef, useId } from 'react';
import { clsx } from '@/utils/format.js';

export const inputCls = 'w-full rounded-md border bg-surface2 px-3.5 text-base text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 focus:border-accent-text focus:outline-none focus:ring-2 focus:ring-accent-text/30 disabled:opacity-60';

/** Label + control + hint + error, wired with aria. `children` receives {id, 'aria-describedby', invalid}. */
export function Field({ label, hint, error, required, children, className }) {
  const id = useId();
  const describedBy = [hint && `${id}-h`, error && `${id}-e`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={clsx('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}{required && <span className="text-accent-text" aria-hidden> *</span>}</label>
      {children({ id, 'aria-describedby': describedBy, invalid: !!error })}
      {hint && !error && <p id={`${id}-h`} className="text-sm text-muted">{hint}</p>}
      {error && <p id={`${id}-e`} role="alert" className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

export const Input = forwardRef(function Input({ invalid, className, ...p }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={clsx(inputCls, 'h-12', invalid ? 'border-danger' : 'border-line', className)} {...p} />;
});
export const Textarea = forwardRef(function Textarea({ invalid, className, ...p }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={clsx(inputCls, 'min-h-24 py-3', invalid ? 'border-danger' : 'border-line', className)} {...p} />;
});
export const Select = forwardRef(function Select({ invalid, className, children, ...p }, ref) {
  return <select ref={ref} aria-invalid={invalid || undefined} className={clsx(inputCls, 'h-12 appearance-none bg-[length:1rem] pr-9', invalid ? 'border-danger' : 'border-line', className)} {...p}>{children}</select>;
});
