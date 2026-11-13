import { clsx } from '@/utils/format.js';
import { Timestamp } from '@/components/common/Time.jsx';
import { ICONS } from '@/constants/icons.js';
import Alert from '@/components/feedback/Alert.jsx';
import Card, { CardTitle } from '@/components/ui/Card.jsx';
import { EmptyState } from '@/components/feedback/States.jsx';
import { Link } from 'react-router-dom';

export function KpiCard({ label, value, hint, icon: Icon, tone, to, className }) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2 text-sm text-muted"><span>{label}</span>{Icon && <Icon size={18} strokeWidth={1.75} aria-hidden className={tone ? `text-${tone}` : 'text-accent-text'} />}</div>
      <p className="mt-2 font-display text-3xl leading-none tabular">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </>
  );
  const cls = clsx('block rounded-lg border border-line bg-surface p-4', to && 'transition-colors hover:bg-surface2', className);
  return to ? <Link to={to} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

/** Occupancy ring: text + numbers beside it, so the visual is never the only carrier of meaning. */
export function OccupancyRing({ spaces }) {
  const { total, occupied, available, outOfService } = spaces;
  const r = 52; const c = 2 * Math.PI * r;
  const pct = total ? Math.round((occupied / total) * 100) : 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 128 128" className="size-32 shrink-0 -rotate-90" role="img" aria-label={`${pct}% occupied: ${occupied} of ${total} spaces`}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--accent-bright)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} style={{ transition: 'stroke-dasharray .6s ease' }} />
        <text x="64" y="64" transform="rotate(90 64 64)" textAnchor="middle" dominantBaseline="central" className="fill-[var(--text)] font-display" fontSize="28" fontWeight="650">{pct}%</text>
      </svg>
      <dl className="grid flex-1 gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-1.5 text-muted"><ICONS.slot.AVAILABLE size={15} className="text-success" aria-hidden />Available</dt><dd className="font-semibold tabular">{available}</dd></div>
        <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-1.5 text-muted"><ICONS.slot.OCCUPIED size={15} className="text-danger" aria-hidden />Occupied</dt><dd className="font-semibold tabular">{occupied}</dd></div>
        <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-1.5 text-muted"><ICONS.slot.OUT_OF_SERVICE size={15} aria-hidden />Out of service</dt><dd className="font-semibold tabular">{outOfService}</dd></div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-1.5"><dt className="text-muted">Total spaces</dt><dd className="font-semibold tabular">{total}</dd></div>
      </dl>
    </div>
  );
}

export function ActivityList({ items }) {
  if (!items?.length) return <EmptyState title="No activity yet">Entries and exits will appear here as they happen.</EmptyState>;
  return (
    <ul className="divide-y divide-line">
      {items.map((a) => {
        const I = a.type === 'ENTRY' ? ICONS.entry : ICONS.exit;
        return (
          <li key={a.id} className="flex items-center gap-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface2 text-accent-text"><I size={16} aria-hidden /></span>
            <span className="min-w-0 flex-1 text-sm"><span className="font-medium">{a.type === 'ENTRY' ? 'Entry' : 'Exit'}</span> <span className="text-muted">{a.message}</span></span>
            <span className="text-xs text-muted"><Timestamp iso={a.at} short /></span>
          </li>
        );
      })}
    </ul>
  );
}

export function AlertList({ alerts }) {
  if (!alerts?.length) return null;
  return <div className="space-y-2" aria-label="Alerts">{alerts.map((a) => <Alert key={a.id} tone={a.severity} title={a.title}>{a.body}</Alert>)}</div>;
}

export function Panel({ title, action, children, className }) { return <Card className={className}><CardTitle action={action}>{title}</CardTitle>{children}</Card>; }
