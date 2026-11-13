import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLot } from '@/context/LotContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { P } from '@/constants/permissions.js';
import { daysAgoISO, formatMoney, todayISO, formatDateTime } from '@/utils/format.js';
import { ICONS } from '@/constants/icons.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Segmented from '@/components/ui/Segmented.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import { QueryState } from '@/components/feedback/States.jsx';
import { useDashboard } from '../hooks/useDashboard.js';
import { ActivityList, AlertList, KpiCard, OccupancyRing, Panel } from '../components/parts.jsx';
import { MethodSplit, OccupancyTrendChart, RevenueByDayChart } from '../components/Charts.jsx';

const RANGES = [{ value: 'today', label: 'Today' }, { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }];

/** Owner / manager overview. "Confirmed revenue" only counts server-confirmed payments; pending is its own card. */
export default function DashboardPage() {
  const { lots, lotId, lot } = useLot();
  const { can } = useAuth();
  const [range, setRange] = useState('today');
  const from = range === 'today' ? todayISO() : daysAgoISO(range === '7d' ? 6 : 29);
  const q = useDashboard({ lotId: lots.length > 1 ? lotId : undefined, from, to: todayISO() });
  const label = RANGES.find((r) => r.value === range).label.toLowerCase();

  return (
    <>
      <PageHeader title="Dashboard" description={`${lot?.name ?? 'All locations'} (${label})`}
        actions={<>
          {can(P.SESSIONS_CREATE) && <Button as={Link} to="/entry" icon={ICONS.entry}>Vehicle entry</Button>}
          <Segmented label="Date range" value={range} onChange={setRange} options={RANGES} />
        </>} />
      <QueryState query={q} skeleton={<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>}>
        {(d) => (
          <div className="space-y-5">
            <AlertList alerts={d.alerts} />
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-lg border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted">Confirmed revenue ({label})</p><Badge tone="success" icon={ICONS.payment.SUCCESS}>Server-confirmed only</Badge></div>
                <p className="mt-2 font-display text-5xl tabular">{formatMoney(d.confirmedRevenue)}</p>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-muted">Cash</dt><dd className="font-semibold tabular">{formatMoney(d.cashRevenue)}</dd></div>
                  <div><dt className="text-muted">Mobile money</dt><dd className="font-semibold tabular">{formatMoney(d.mobileMoneyRevenue)}</dd></div>
                  <div><dt className="text-muted">Average ticket</dt><dd className="font-semibold tabular">{formatMoney(d.averageTicket)}</dd></div>
                </dl>
                <p className="mt-3 text-xs text-muted">Updated {formatDateTime(d.generatedAt)}. Pending and failed payments are shown separately and never counted here.</p>
              </div>
              <div className="rounded-lg border border-line bg-surface p-5"><OccupancyRing spaces={d.spaces} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard label="Vehicles" value={d.vehiclesToday} hint={`Entries (${label})`} icon={ICONS.vehicle.CAR} />
              <KpiCard label="Active sessions" value={d.activeSessions} hint="Currently parked" icon={ICONS.sessions} to="/sessions" />
              <KpiCard label="Payments pending" value={d.pendingPayments.count} hint={`${formatMoney(d.pendingPayments.amount)} awaiting confirmation`} icon={ICONS.payment.PENDING} tone="warning" to="/payments" />
              <KpiCard label="Failed payments" value={d.failedPayments.count} hint="Not confirmed" icon={ICONS.payment.FAILED} tone="danger" to="/payments?status=FAILED" />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <Panel title="Confirmed revenue, last 7 days"><RevenueByDayChart data={d.revenueByDay} /></Panel>
              <Panel title="Occupancy, last 12 hours"><OccupancyTrendChart data={d.occupancyTrend} capacity={d.spaces.total} /></Panel>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Panel title="Revenue by payment method"><MethodSplit data={d.revenueByMethod} /></Panel>
              <Panel title="Recent activity" action={<Link to="/history" className="text-sm text-accent-text hover:underline">History</Link>}><ActivityList items={d.recentActivity} /></Panel>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}
