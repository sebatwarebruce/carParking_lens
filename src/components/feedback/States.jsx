import { Inbox, RefreshCw, SearchX, ShieldX, WifiOff } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import { SkeletonRows } from '@/components/ui/Skeleton.jsx';
import { MSG } from '@/constants/messages.js';
import { clsx } from '@/utils/format.js';

function Panel({ icon: Icon, title, children, action, tone, className }) {
  return (
    <div role="status" className={clsx('mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-10 text-center', className)}>
      <span className={clsx('grid size-14 place-items-center rounded-full border border-line bg-surface2', tone === 'danger' ? 'text-danger' : 'text-muted')}><Icon size={26} strokeWidth={1.5} aria-hidden /></span>
      <h3 className="font-display text-lg">{title}</h3>
      {children && <p className="text-sm text-muted">{children}</p>}
      {action}
    </div>
  );
}
export const EmptyState = ({ title = 'Nothing here yet', children, action, className }) => <Panel icon={Inbox} title={title} action={action} className={className}>{children}</Panel>;
export const NoResults = ({ children = 'Try a different search or clear the filters.', action }) => <Panel icon={SearchX} title="No results" action={action}>{children}</Panel>;
export const ForbiddenState = () => <Panel icon={ShieldX} title="You can't open this screen">{MSG.forbidden}</Panel>;

export function ErrorState({ error, onRetry }) {
  const offline = error?.kind === 'network';
  return (
    <Panel icon={offline ? WifiOff : RefreshCw} tone="danger" title={offline ? 'Connection lost' : 'Could not load this'}
      action={<div className="flex flex-col items-center gap-2">{onRetry && <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>Try again</Button>}{error?.requestId && <p className="text-xs text-muted">Reference: <span className="font-mono">{error.requestId}</span></p>}</div>}>
      {error?.message || MSG.genericError}
    </Panel>
  );
}

/**
 * One place that renders loading / error / empty / data for any TanStack query.
 * `isEmpty(data)` decides the empty state; children is a render function.
 */
export function QueryState({ query, children, skeleton, isEmpty, empty, rows = 4 }) {
  if (query.isPending) return skeleton ?? <SkeletonRows rows={rows} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (isEmpty?.(query.data)) return empty ?? <EmptyState />;
  return children(query.data);
}
