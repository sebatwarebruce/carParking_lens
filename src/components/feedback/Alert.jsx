import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react';
import { clsx } from '@/utils/format.js';
const ICON = { success: CircleCheck, danger: CircleX, warning: TriangleAlert, info: Info };
export default function Alert({ tone = 'info', title, children, action, className, live = false }) {
  const Icon = ICON[tone];
  return (
    <div role={live ? 'alert' : 'status'} className={clsx('tone flex gap-3 rounded-md p-3.5', `tone-${tone}`, className)}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-sm text-ink">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={clsx(title && 'mt-0.5', 'text-ink/90')}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
