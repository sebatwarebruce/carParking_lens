import { Check } from 'lucide-react';
import { clsx } from '@/utils/format.js';
/** Progress through a real sequence (entry steps), so numbering is meaningful here. */
export default function Stepper({ steps, current }) {
  return (
    <ol className="mb-5 flex items-center gap-2" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current; const on = i === current;
        return (
          <li key={s} className="flex flex-1 items-center gap-2" aria-current={on ? 'step' : undefined}>
            <span className={clsx('grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold', done ? 'border-accent bg-accent text-on-accent' : on ? 'border-accent-text text-accent-text' : 'border-line text-muted')}>{done ? <Check size={14} aria-label="Completed" /> : i + 1}</span>
            <span className={clsx('hidden truncate text-sm sm:block', on ? 'font-semibold' : 'text-muted')}>{s}</span>
            {i < steps.length - 1 && <span className={clsx('h-px flex-1', done ? 'bg-accent' : 'bg-line')} />}
          </li>
        );
      })}
    </ol>
  );
}
