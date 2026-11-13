import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { sessionService } from '@/services/sessionService.js';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { vehicleTypeLabel } from '@/constants/vehicleTypes.js';
import { methodLabel } from '@/constants/paymentMethods.js';
import { maskPhone, formatDuration } from '@/utils/format.js';
import { useSession } from '../hooks/useSessions.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Card, { CardTitle } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import { QueryState } from '@/components/feedback/States.jsx';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import SecurePhoto from '@/components/common/SecurePhoto.jsx';
import QrTicket from '@/components/common/QrTicket.jsx';
import ConfirmDialog from '@/components/common/ConfirmDialog.jsx';
import Money from '@/components/common/Money.jsx';
import { ElapsedTimer, Timestamp } from '@/components/common/Time.jsx';

export default function SessionDetailPage() {
  const { id } = useParams();
  const q = useSession(id);
  const qc = useQueryClient();
  const [cancel, setCancel] = useState(false);
  const m = useGuardedMutation((reason) => sessionService.cancel(id, { reason }), { onSuccess: () => { ['sessions', 'slots', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); setCancel(false); } });
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/sessions" className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden />Sessions</Link>
      <QueryState query={q} rows={4}>
        {(s) => (
          <div className="space-y-4">
            <PageHeader title={s.vehicle.displayPlate} description={`Ticket ${s.ticketNumber}`}><div className="mt-2"><StatusBadge status={s.status} /></div></PageHeader>
            <div className="flex flex-wrap gap-2">
              {(s.allowedActions.includes('CHECKOUT') || s.allowedActions.includes('PAY')) && <Button as={Link} to={`/exit/${s.id}`}>{s.status === 'ACTIVE' ? 'Start checkout' : 'Open payment'}</Button>}
              {s.receiptId && <Button as={Link} to={`/receipts/${s.receiptId}`} variant="secondary">View receipt</Button>}
              {s.allowedActions.includes('CANCEL') && <Button variant="danger" onClick={() => setCancel(true)}>Cancel session</Button>}
            </div>
            <Card><CardTitle>Details</CardTitle>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                <div><dt className="text-muted">Vehicle</dt><dd>{vehicleTypeLabel(s.vehicle.vehicleType)}</dd></div>
                <div><dt className="text-muted">Space</dt><dd className="font-semibold">{s.slot.slotNumber}</dd></div>
                <div><dt className="text-muted">Location</dt><dd>{s.lotName}</dd></div>
                <div><dt className="text-muted">Customer phone</dt><dd>{maskPhone(s.vehicle.ownerPhone)}</dd></div>
                <div><dt className="text-muted">Entered</dt><dd><Timestamp iso={s.entryTime} /></dd></div>
                <div><dt className="text-muted">{s.exitTime ? 'Exited' : 'Parked for'}</dt><dd>{s.exitTime ? <Timestamp iso={s.exitTime} /> : <ElapsedTimer entryTime={s.entryTime} />}</dd></div>
                {s.durationMinutes != null && <div><dt className="text-muted">Duration</dt><dd>{formatDuration(s.durationMinutes)}</dd></div>}
                {s.amountDue != null && <div><dt className="text-muted">Amount due</dt><dd><Money amount={s.amountDue} /></dd></div>}
                <div><dt className="text-muted">Entry by</dt><dd>{s.createdBy?.name}</dd></div>
              </dl>
            </Card>
            <Card><CardTitle>Photos</CardTitle>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="mb-1 text-xs text-muted">Entry</p><SecurePhoto photo={s.entryPhoto} alt="Entry photo" label="Entry photo" className="aspect-[4/3] w-full" /></div>
                <div><p className="mb-1 text-xs text-muted">Exit</p><SecurePhoto photo={s.exitPhoto} alt="Exit photo" label="Exit photo" className="aspect-[4/3] w-full" /></div>
              </div>
            </Card>
            {s.payments?.length > 0 && (
              <Card><CardTitle>Payment attempts</CardTitle>
                <ul className="divide-y divide-line">{s.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div><p className="font-medium">{methodLabel(p.method)} <span className="text-muted">(<Timestamp iso={p.createdAt} short />)</span></p><p className="font-mono text-xs text-muted">{p.transactionReference}</p></div>
                    <div className="flex items-center gap-3"><Money amount={p.amount} /><StatusBadge kind="payment" status={p.status} /></div>
                  </li>))}
                </ul>
              </Card>
            )}
            {s.status === 'ACTIVE' && <Card className="text-center"><QrTicket ticketNumber={s.ticketNumber} /></Card>}
            <ConfirmDialog open={cancel} onClose={() => setCancel(false)} title="Cancel this session?" description="Use only for invalid or aborted sessions. The space is released and the action is audited." requireReason tone="danger" confirmLabel="Cancel session" loading={m.isSubmitting} error={m.error} onConfirm={(r) => m.mutate(r)} />
          </div>
        )}
      </QueryState>
    </div>
  );
}
