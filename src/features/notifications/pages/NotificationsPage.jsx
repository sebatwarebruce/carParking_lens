import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck } from 'lucide-react';
import { notificationService } from '@/services/notificationService.js';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import { EmptyState, QueryState } from '@/components/feedback/States.jsx';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notifications'], queryFn: notificationService.list, staleTime: 15_000 });
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  const all = useGuardedMutation(() => notificationService.markAllRead(), { onSuccess: refresh });
  const one = useGuardedMutation((id) => notificationService.markRead(id), { onSuccess: refresh });
  const unread = q.data?.items.filter((n) => !n.read).length ?? 0;
  return (
    <>
      <PageHeader title="Notifications" description="Alerts that need attention." actions={<Button variant="secondary" icon={CheckCheck} disabled={!unread} loading={all.isSubmitting} onClick={() => all.mutate()}>Mark all read</Button>} />
      <QueryState query={q} isEmpty={(d) => !d.items.length} empty={<EmptyState title="You're all caught up" />}>
        {(d) => (
          <ul className="mx-auto max-w-2xl space-y-2.5">
            {d.items.map((n) => (
              <li key={n.id}>
                <Alert tone={n.severity} title={`${n.title}${n.read ? '' : ' (new)'}`} action={<div className="flex flex-wrap items-center gap-3 text-sm">{n.sessionId && <Link to={`/sessions/${n.sessionId}`} className="text-accent-text hover:underline">Open session</Link>}{!n.read && <button className="min-h-9 text-muted hover:text-ink" onClick={() => one.mutate(n.id)}>Mark read</button>}<span className="text-muted"><Timestamp iso={n.createdAt} /></span></div>}>{n.body}</Alert>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </>
  );
}
