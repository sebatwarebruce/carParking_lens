import { clsx } from '@/utils/format.js';
export default function Skeleton({ className }) { return <div aria-hidden className={clsx('skeleton', className)} />; }
export function SkeletonRows({ rows = 4, className }) {
  return <div role="status" aria-label="Loading" className={clsx('space-y-3', className)}>{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
}
