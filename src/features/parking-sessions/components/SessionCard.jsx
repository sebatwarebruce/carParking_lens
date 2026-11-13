import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ICONS } from '@/constants/icons.js';
import { vehicleTypeLabel } from '@/constants/vehicleTypes.js';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import { ElapsedTimer, Timestamp } from '@/components/common/Time.jsx';
import { maskPhone } from '@/utils/format.js';

/** Compact, scannable session row for phones and lists. Plate and elapsed time lead. */
export default function SessionCard({ session: s, to, showPhone, action }) {
  const Icon = ICONS.vehicle[s.vehicle.vehicleType] || ICONS.vehicle.OTHER;
  const body = (
    <div className="flex items-center gap-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-md border border-line bg-surface2 text-accent-text"><Icon size={22} strokeWidth={1.75} aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="plate text-lg leading-tight">{s.vehicle.displayPlate}</span>
          <StatusBadge status={s.status} />
        </div>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-sm text-muted">
          <dt className="sr-only">Space</dt><dd className="text-ink">Space {s.slot.slotNumber}<span className="text-muted"> ({vehicleTypeLabel(s.vehicle.vehicleType)})</span></dd>
          <dt className="sr-only">Parked</dt><dd>{s.status === 'ACTIVE' ? <>Parked <ElapsedTimer entryTime={s.entryTime} className="text-ink" /></> : <>Entered <Timestamp iso={s.entryTime} short /></>}</dd>
          <dt className="sr-only">Ticket</dt><dd className="font-mono text-xs">{s.ticketNumber}{showPhone && s.vehicle.ownerPhone ? ` / ${maskPhone(s.vehicle.ownerPhone)}` : ''}</dd>
        </dl>
      </div>
      {action ?? (to && <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />)}
    </div>
  );
  const cls = 'block rounded-md border border-line bg-surface p-3.5 transition-colors hover:bg-surface2 active:bg-surface2';
  return to ? <Link to={to} className={cls} aria-label={`Session ${s.vehicle.displayPlate}, space ${s.slot.slotNumber}`}>{body}</Link> : <div className={cls}>{body}</div>;
}
