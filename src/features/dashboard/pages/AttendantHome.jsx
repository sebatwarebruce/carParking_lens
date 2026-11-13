import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLot } from '@/context/LotContext.jsx';
import { todayISO } from '@/utils/format.js';
import { ICONS } from '@/constants/icons.js';
import { P } from '@/constants/permissions.js';
import Card, { CardTitle } from '@/components/ui/Card.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import { EmptyState, QueryState } from '@/components/feedback/States.jsx';
import { SessionCard, useActiveSessions } from '@/features/parking-sessions/index.js';
import { useDashboard } from '../hooks/useDashboard.js';
import { ActivityList, KpiCard } from '../components/parts.jsx';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

/** Phone-first attendant home. The Lens-ringed Entry action is the single most prominent element. */
export default function AttendantHome() {
  const { user, can } = useAuth();
  const { lotId, lot } = useLot();
  const dash = useDashboard({ lotId, from: todayISO(), to: todayISO() }, !!lotId);
  const sessions = useActiveSessions({ lotId, pageSize: 5 }, { enabled: !!lotId });
  const d = dash.data;
  return (
    <div className="space-y-5">
      <div className="lens-glow">
        <h1 className="font-display text-2xl sm:text-3xl">{greeting()}, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-muted">{lot?.name}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {can(P.SESSIONS_CREATE) && (
          <motion.div whileTap={{ scale: 0.985 }}>
            <Link to="/entry" className="lens-ring lens-idle relative flex min-h-[132px] items-center gap-4 overflow-hidden !rounded-[28px] bg-accent p-5 text-on-accent">
              <span className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-on-accent/60"><ICONS.lens size={34} strokeWidth={1.5} aria-hidden /></span>
              <span><span className="block font-display text-2xl leading-tight">Vehicle entry</span><span className="block text-sm opacity-80">Plate, space and photo</span></span>
            </Link>
          </motion.div>
        )}
        {can(P.SESSIONS_CHECKOUT) && (
          <motion.div whileTap={{ scale: 0.985 }}>
            <Link to="/exit" className="neu flex min-h-[132px] items-center gap-4 !rounded-[28px] p-5">
              <span className="grid size-16 shrink-0 place-items-center rounded-full border border-line bg-surface2 text-accent-text"><ICONS.exit size={30} strokeWidth={1.5} aria-hidden /></span>
              <span><span className="block font-display text-2xl leading-tight">Vehicle exit</span><span className="block text-sm text-muted">Ticket, plate, phone or QR</span></span>
            </Link>
          </motion.div>
        )}
      </div>

      {dash.isPending ? <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div> : d && (
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Available" value={d.spaces.available} icon={ICONS.slot.AVAILABLE} tone="success" to="/spaces?status=AVAILABLE" />
          <KpiCard label="Occupied" value={d.spaces.occupied} icon={ICONS.slot.OCCUPIED} tone="danger" to="/spaces?status=OCCUPIED" />
          <KpiCard label="Out of service" value={d.spaces.outOfService} icon={ICONS.slot.OUT_OF_SERVICE} to="/spaces?status=OUT_OF_SERVICE" />
        </div>
      )}

      <Card>
        <CardTitle action={<Link to="/sessions" className="text-sm text-accent-text hover:underline">See all</Link>}>Parked now</CardTitle>
        <QueryState query={sessions} rows={3} isEmpty={(s) => !s.items.length} empty={<EmptyState title="No vehicles parked">New entries will show here.</EmptyState>}>
          {(s) => <div className="space-y-2.5">{s.items.map((x) => <SessionCard key={x.id} session={x} to={`/sessions/${x.id}`} />)}</div>}
        </QueryState>
      </Card>

      <Card><CardTitle>Recent activity</CardTitle>{d ? <ActivityList items={d.recentActivity} /> : <Skeleton className="h-24" />}</Card>
    </div>
  );
}
