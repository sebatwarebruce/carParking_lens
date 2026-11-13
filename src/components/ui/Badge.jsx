import { clsx } from '@/utils/format.js';
export default function Badge({ tone = 'neutral', icon: Icon, children, className }) {
  return (
    <span className={clsx('tone inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', tone !== 'neutral' && `tone-${tone}`, className)}>
      {Icon && <Icon size={14} strokeWidth={2} aria-hidden />}
      {children}
    </span>
  );
}
