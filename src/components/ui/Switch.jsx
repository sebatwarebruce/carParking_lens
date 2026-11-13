import { clsx } from '@/utils/format.js';
export default function Switch({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={clsx('relative h-7 w-12 shrink-0 rounded-full border border-line transition-colors disabled:opacity-50', checked ? 'bg-accent' : 'bg-surface2')}>
      <span className={clsx('absolute top-0.5 size-6 rounded-full bg-ink transition-all', checked ? 'left-[22px]' : 'left-0.5')} style={{ background: checked ? 'var(--on-accent)' : 'var(--text-muted)' }} />
    </button>
  );
}
