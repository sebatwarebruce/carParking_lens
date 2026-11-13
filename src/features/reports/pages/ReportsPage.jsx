import { useQuery } from '@tanstack/react-query';
import { Download, Printer } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { reportService } from '@/services/reportService.js';
import { useLot } from '@/context/LotContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { useUrlState } from '@/hooks/useUrlState.js';
import { P } from '@/constants/permissions.js';
import { ROLE_LABELS } from '@/constants/roles.js';
import { methodLabel } from '@/constants/paymentMethods.js';
import { downloadCsv } from '@/utils/csv.js';
import { daysAgoISO, formatDate, formatDuration, formatMoney, todayISO } from '@/utils/format.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Segmented from '@/components/ui/Segmented.jsx';
import Button from '@/components/ui/Button.jsx';
import Card, { CardTitle } from '@/components/ui/Card.jsx';
import DataTable from '@/components/tables/DataTable.jsx';
import Money from '@/components/common/Money.jsx';
import { Field, Input } from '@/components/forms/Field.jsx';
import { EmptyState, QueryState } from '@/components/feedback/States.jsx';
import { KpiCard } from '@/features/dashboard/components/parts.jsx';
import { MethodSplit } from '@/features/dashboard/components/Charts.jsx';

const PERIODS = [{ value: 'day', label: 'Daily' }, { value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }, { value: 'custom', label: 'Custom' }];
const TABS = [{ value: 'revenue', label: 'Revenue' }, { value: 'occupancy', label: 'Occupancy' }, { value: 'staff', label: 'Attendants' }, { value: 'sessions', label: 'Sessions' }];
const rangeFor = (p, from, to) => (p === 'day' ? [todayISO(), todayISO()] : p === 'week' ? [daysAgoISO(6), todayISO()] : p === 'month' ? [daysAgoISO(29), todayISO()] : [from || daysAgoISO(6), to || todayISO()]);
const tip = { contentStyle: { background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }, cursor: { fill: 'var(--surface-2)' } };
const axis = { stroke: 'var(--text-muted)', fontSize: 12, tickLine: false, axisLine: false };
const short = (d) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));

export default function ReportsPage() {
  const { lots, lotId, lot } = useLot();
  const { can } = useAuth();
  const [f, setF] = useUrlState({ tab: 'revenue', period: 'week', from: '', to: '' });
  const [from, to] = rangeFor(f.period, f.from, f.to);
  const params = { lotId: lots.length > 1 ? lotId : undefined, from, to };
  const kind = f.tab === 'revenue' ? 'revenue' : f.tab === 'occupancy' ? 'occupancy' : f.tab === 'staff' ? 'attendants' : 'sessions';
  const q = useQuery({ queryKey: ['reports', kind, params], queryFn: () => reportService[kind](params), staleTime: 60_000 });
  const meta = [`Report: ${TABS.find((t) => t.value === f.tab).label}`, `Location: ${lot?.name ?? 'All'}`, `Period: ${from} to ${to}`, 'Basis: confirmed payments only'];

  const exportCsv = () => {
    const d = q.data; if (!d) return;
    if (f.tab === 'revenue') downloadCsv(`revenue_${from}_${to}.csv`, [{ label: 'Date', value: 'date' }, { label: 'Confirmed (RWF)', value: 'amount' }, { label: 'Cash (RWF)', value: 'cash' }, { label: 'Mobile money (RWF)', value: 'mobileMoney' }, { label: 'Payments', value: 'count' }], d.rows, meta);
    if (f.tab === 'occupancy') downloadCsv(`occupancy_${from}_${to}.csv`, [{ label: 'Date', value: 'date' }, { label: 'Peak occupied', value: 'peakOccupied' }, { label: 'Capacity', value: 'capacity' }, { label: 'Sessions', value: 'sessions' }], d.rows, meta);
    if (f.tab === 'staff') downloadCsv(`attendants_${from}_${to}.csv`, [{ label: 'Name', value: (r) => r.user.name }, { label: 'Role', value: (r) => ROLE_LABELS[r.user.role] }, { label: 'Entries', value: 'entries' }, { label: 'Payments confirmed', value: 'paymentsConfirmed' }, { label: 'Amount (RWF)', value: 'confirmedAmount' }], d.rows, meta);
    if (f.tab === 'sessions') downloadCsv(`sessions_${from}_${to}.csv`, [{ label: 'Group', value: 'label' }, { label: 'Count', value: 'count' }], [...d.byVehicleType, ...d.byStatus], meta);
  };

  return (
    <>
      <PageHeader title="Reports" description={`${lot?.name ?? 'All locations'} (${formatDate(from)} to ${formatDate(to)})`}
        actions={<>{can(P.REPORTS_EXPORT) && <Button variant="secondary" icon={Download} onClick={exportCsv} disabled={!q.data}>Export CSV</Button>}<Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button></>} />
      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        <Segmented label="Report" value={f.tab} onChange={(v) => setF({ tab: v })} options={TABS} />
        <Segmented label="Period" value={f.period} onChange={(v) => setF({ period: v })} options={PERIODS} />
        {f.period === 'custom' && <div className="flex gap-2"><Field label="From">{(p) => <Input {...p} type="date" value={from} onChange={(e) => setF({ from: e.target.value })} />}</Field><Field label="To">{(p) => <Input {...p} type="date" value={to} onChange={(e) => setF({ to: e.target.value })} />}</Field></div>}
      </div>
      <QueryState query={q} rows={4}>
        {(d) => f.tab === 'revenue' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><KpiCard label="Confirmed revenue" value={formatMoney(d.total)} hint="Confirmed payments only" /><KpiCard label="Payments" value={d.rows.reduce((a, r) => a + r.count, 0)} /><KpiCard label="Days in range" value={d.rows.length} /></div>
            <Card><CardTitle>Confirmed revenue by day</CardTitle>
              {d.total === 0 ? <EmptyState title="No confirmed revenue in this period" /> : (
                <div className="h-64" role="img" aria-label="Confirmed revenue by day, cash versus mobile money"><ResponsiveContainer><BarChart data={d.rows} margin={{ left: -12 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={short} {...axis} /><YAxis tickFormatter={(v) => `${v / 1000}k`} {...axis} width={44} /><Tooltip {...tip} formatter={(v) => formatMoney(v)} labelFormatter={short} /><Legend /><Bar dataKey="cash" name="Cash" stackId="a" fill="var(--accent)" /><Bar dataKey="mobileMoney" name="Mobile money" stackId="a" fill="var(--accent-bright)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
              )}
            </Card>
            <div className="grid gap-3 lg:grid-cols-2">
              <Card><CardTitle>By payment method</CardTitle><MethodSplit data={d.byMethod} /></Card>
              <Card><CardTitle>Daily totals</CardTitle><DataTable caption="Daily revenue" rows={d.rows} rowKey={(r) => r.date} columns={[{ key: 'd', header: 'Date', primary: true, cell: (r) => formatDate(r.date) }, { key: 'a', header: 'Confirmed', className: 'text-right', cell: (r) => <Money amount={r.amount} /> }, { key: 'c', header: 'Payments', cell: (r) => r.count }]} /></Card>
            </div>
            <p className="text-xs text-muted">Methods: {d.byMethod.map((m) => methodLabel(m.method)).join(', ')}. Pending, failed and voided payments are excluded.</p>
          </div>
        ) : f.tab === 'occupancy' ? (
          <Card><CardTitle>Peak occupancy per day</CardTitle>
            <div className="h-64" role="img" aria-label="Peak occupied spaces per day"><ResponsiveContainer><BarChart data={d.rows} margin={{ left: -20 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={short} {...axis} /><YAxis allowDecimals={false} {...axis} /><Tooltip {...tip} labelFormatter={short} /><Bar dataKey="peakOccupied" name="Peak occupied" fill="var(--accent-bright)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
            <DataTable caption="Occupancy" rows={d.rows} rowKey={(r) => r.date} columns={[{ key: 'd', header: 'Date', primary: true, cell: (r) => formatDate(r.date) }, { key: 'p', header: 'Peak occupied', cell: (r) => `${r.peakOccupied} of ${r.capacity}` }, { key: 's', header: 'Sessions', cell: (r) => r.sessions }]} />
          </Card>
        ) : f.tab === 'staff' ? (
          <DataTable caption="Attendant activity" rows={d.rows} rowKey={(r) => r.user.id} columns={[{ key: 'n', header: 'Name', primary: true, cell: (r) => r.user.name }, { key: 'r', header: 'Role', cell: (r) => ROLE_LABELS[r.user.role] }, { key: 'e', header: 'Entries', cell: (r) => r.entries }, { key: 'p', header: 'Payments confirmed', cell: (r) => r.paymentsConfirmed }, { key: 'a', header: 'Amount', className: 'text-right', cell: (r) => <Money amount={r.confirmedAmount} /> }]} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><KpiCard label="Sessions" value={d.total} /><KpiCard label="Completed" value={d.completed} /><KpiCard label="Parked now" value={d.active} /><KpiCard label="Average stay" value={formatDuration(d.averageDurationMinutes)} /></div>
            <div className="grid gap-3 lg:grid-cols-2"><Card><CardTitle>By vehicle type</CardTitle><DataTable caption="By vehicle type" rows={d.byVehicleType} rowKey={(r) => r.label} columns={[{ key: 'l', header: 'Type', primary: true, cell: (r) => r.label }, { key: 'c', header: 'Sessions', cell: (r) => r.count }]} /></Card><Card><CardTitle>By status</CardTitle><DataTable caption="By status" rows={d.byStatus} rowKey={(r) => r.label} columns={[{ key: 'l', header: 'Status', primary: true, cell: (r) => r.label }, { key: 'c', header: 'Sessions', cell: (r) => r.count }]} /></Card></div>
          </div>
        )}
      </QueryState>
    </>
  );
}
