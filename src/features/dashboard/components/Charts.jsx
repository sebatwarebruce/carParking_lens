import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, formatTime } from '@/utils/format.js';
import { methodLabel } from '@/constants/paymentMethods.js';
import { EmptyState } from '@/components/feedback/States.jsx';

const axis = { stroke: 'var(--text-muted)', fontSize: 12, tickLine: false, axisLine: false };
const tip = { contentStyle: { background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }, labelStyle: { color: 'var(--text-muted)' }, cursor: { fill: 'var(--surface-2)' } };
const shortDay = (d) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));

/** Text summary accompanies each chart for screen readers and for clarity. */
function Chart({ label, summary, children, empty }) {
  if (empty) return <EmptyState title="No data for this period">Charts fill in as confirmed payments and sessions are recorded.</EmptyState>;
  return (
    <figure>
      <div className="h-56 w-full" role="img" aria-label={label}>{children}</div>
      <figcaption className="mt-2 text-xs text-muted">{summary}</figcaption>
    </figure>
  );
}

export function RevenueByDayChart({ data }) {
  const total = data.reduce((a, d) => a + d.confirmed, 0);
  return (
    <Chart label="Confirmed revenue by day" empty={total === 0} summary={`Confirmed revenue over the last ${data.length} days: ${formatMoney(total)}. Pending and failed payments are excluded.`}>
      <ResponsiveContainer><BarChart data={data} margin={{ left: -12, right: 4, top: 8 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={shortDay} {...axis} /><YAxis tickFormatter={(v) => `${v / 1000}k`} {...axis} width={44} /><Tooltip {...tip} formatter={(v) => [formatMoney(v), 'Confirmed']} labelFormatter={shortDay} /><Bar dataKey="confirmed" fill="var(--accent-bright)" radius={[6, 6, 0, 0]} maxBarSize={36} /></BarChart></ResponsiveContainer>
    </Chart>
  );
}

export function OccupancyTrendChart({ data, capacity }) {
  const peak = Math.max(0, ...data.map((d) => d.occupied));
  return (
    <Chart label="Occupied spaces over the last 12 hours" empty={peak === 0} summary={`Peak of ${peak} occupied spaces in the last 12 hours${capacity ? ` out of ${capacity}` : ''}.`}>
      <ResponsiveContainer><AreaChart data={data} margin={{ left: -20, right: 4, top: 8 }}><defs><linearGradient id="occ" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent-bright)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--accent-bright)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="at" tickFormatter={(v) => formatTime(v)} {...axis} minTickGap={24} /><YAxis allowDecimals={false} {...axis} width={44} domain={[0, capacity || 'auto']} /><Tooltip {...tip} labelFormatter={(v) => formatTime(v)} formatter={(v) => [v, 'Occupied']} /><Area type="monotone" dataKey="occupied" stroke="var(--accent-bright)" strokeWidth={2} fill="url(#occ)" /></AreaChart></ResponsiveContainer>
    </Chart>
  );
}

export function MethodSplit({ data }) {
  const total = data.reduce((a, d) => a + d.amount, 0);
  if (total === 0) return <EmptyState title="No confirmed payments yet" />;
  return (
    <ul className="space-y-3">
      {data.map((d) => { const pct = Math.round((d.amount / total) * 100); return (
        <li key={d.method}>
          <div className="mb-1 flex justify-between text-sm"><span>{methodLabel(d.method)}</span><span className="tabular text-muted">{formatMoney(d.amount)} ({pct}%)</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-surface2" role="presentation"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
        </li>); })}
    </ul>
  );
}
