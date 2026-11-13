import Badge from '@/components/ui/Badge.jsx';
import { SESSION_STATUS, PAYMENT_STATUS, SLOT_STATUS } from '@/constants/statuses.js';

const MAPS = { session: SESSION_STATUS, payment: PAYMENT_STATUS, slot: SLOT_STATUS };
/** Status = icon + text + colour. Never colour alone. */
export default function StatusBadge({ kind = 'session', status, className }) {
  const s = MAPS[kind][status] ?? { label: status, tone: 'neutral' };
  return <Badge tone={s.tone} icon={s.icon} className={className}>{s.label}</Badge>;
}
