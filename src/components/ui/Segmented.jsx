import { useId } from 'react';
import { motion } from 'motion/react';
import { clsx } from '@/utils/format.js';

/** Segmented control / tabs with a shared-layout active pill (Motion-Primitives AnimatedBackground pattern). */
export default function Segmented({ value, onChange, options, label, className, size = 'md' }) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className={clsx('inline-flex max-w-full gap-1 overflow-x-auto rounded-md border border-line bg-surface2 p-1 scroll-hide', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={clsx('relative whitespace-nowrap rounded-sm px-3 text-sm transition-colors', size === 'md' ? 'h-9' : 'h-8', active ? 'font-semibold text-ink' : 'text-muted hover:text-ink')}>
            {active && <motion.span layoutId={id} className="absolute inset-0 rounded-sm border border-line bg-bg-raised" style={{ background: 'var(--bg-raised)' }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span className="relative z-10 inline-flex items-center gap-1.5">{o.icon && <o.icon size={15} aria-hidden />}{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
