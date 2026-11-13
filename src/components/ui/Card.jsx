import { clsx } from '@/utils/format.js';
export default function Card({ as: Tag = 'section', raised = false, className, children, ...rest }) {
  return <Tag className={clsx('rounded-lg border border-line bg-surface p-4 sm:p-5', raised && 'neu', className)} {...rest}>{children}</Tag>;
}
export function CardTitle({ children, action, className }) {
  return <div className={clsx('mb-3 flex items-center justify-between gap-3', className)}><h2 className="font-display text-lg">{children}</h2>{action}</div>;
}
