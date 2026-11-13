import { Link } from 'react-router-dom';
import { ICONS } from '@/constants/icons.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { QueryState } from '@/components/feedback/States.jsx';
import { useDashboard } from '../hooks/useDashboard.js';
import { KpiCard, Panel } from '../components/parts.jsx';

/** Platform-level view for SUPER_ADMIN. No lot-level operations here. */
export default function PlatformHome() {
  const q = useDashboard({});
  return (
    <>
      <PageHeader title="Platform overview" description="Organizations and platform activity across all customers." />
      <QueryState query={q}>
        {(d) => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard label="Organizations" value={d.organizations.total} icon={ICONS.organizations} to="/organizations" />
              <KpiCard label="Active" value={d.organizations.active} icon={ICONS.payment.SUCCESS} tone="success" />
              <KpiCard label="Suspended" value={d.organizations.suspended} icon={ICONS.warning} tone="warning" />
              <KpiCard label="Parking locations" value={d.lots} icon={ICONS.locations} />
            </div>
            <Panel title="Organizations" action={<Link to="/organizations" className="text-sm text-accent-text hover:underline">Manage</Link>}>
              <ul className="divide-y divide-line">
                {d.recent.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                    <div><p className="font-medium">{o.name}</p><p className="text-sm text-muted">{o.lots} locations, {o.users} users</p></div>
                    <Badge tone={o.status === 'ACTIVE' ? 'success' : 'warning'} icon={o.status === 'ACTIVE' ? ICONS.payment.SUCCESS : ICONS.warning}>{o.status === 'ACTIVE' ? 'Active' : 'Suspended'}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}
      </QueryState>
    </>
  );
}
