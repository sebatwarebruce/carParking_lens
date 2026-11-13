import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calculator } from 'lucide-react';
import { sessionService } from '@/services/sessionService.js';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { useSession, sessionKeys } from '@/features/parking-sessions/index.js';
import { useSlots } from '@/features/parking-slots/hooks/useSlots.js';
import { useNetwork } from '@/app/providers/NetworkProvider.jsx';
import { vehicleTypeLabel } from '@/constants/vehicleTypes.js';
import { MSG } from '@/constants/messages.js';
import { uuid } from '@/utils/ids.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Card, { CardTitle } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import { QueryState } from '@/components/feedback/States.jsx';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import SecurePhoto from '@/components/common/SecurePhoto.jsx';
import CameraCapture from '@/components/common/CameraCapture.jsx';
import ConfirmDialog from '@/components/common/ConfirmDialog.jsx';
import { ElapsedTimer, Timestamp } from '@/components/common/Time.jsx';
import PaymentPanel, { PaymentConfirmed } from '@/features/payments/components/PaymentPanel.jsx';
import FeeReview from '../components/FeeReview.jsx';

function SlotReleased({ session }) {
  const q = useSlots(session.lotId, { q: session.slot.slotNumber }, { refetchInterval: false });
  const slot = q.data?.find((s) => s.id === session.slot.id);
  if (slot?.status !== 'AVAILABLE') return null;
  return <p className="text-center text-sm text-muted">Space {session.slot.slotNumber} is now available.</p>;
}

export default function CheckoutPage() {
  const { sessionId } = useParams();
  const qc = useQueryClient();
  const { online } = useNetwork();
  const polling = (q) => (q.state.data?.status === 'PAYMENT_PENDING' ? 2500 : false);
  const q = useSession(sessionId, { refetchInterval: polling });
  const [confirmed, setConfirmed] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [freeOpen, setFreeOpen] = useState(false);
  const key = useRef(uuid());

  const checkout = useGuardedMutation(() => sessionService.checkout(sessionId, { exitPhotoUrl: photo?.ref?.url }, key.current), {
    onSuccess: (co) => { qc.setQueryData(sessionKeys.detail(sessionId), co.session); qc.invalidateQueries({ queryKey: ['sessions'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
    onError: (e) => { if (e.code === 'SESSION_ALREADY_CLOSED') q.refetch(); },
  });
  const complete = useGuardedMutation((reason) => sessionService.complete(sessionId, { reason }), {
    onSuccess: () => { ['sessions', 'slots', 'dashboard', 'receipts'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); setFreeOpen(false); },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/exit" className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden />Back to search</Link>
      <QueryState query={q} rows={3}>
        {(s) => {
          const actions = s.allowedActions;
          const co = s.checkout;
          return (
            <div className="space-y-4">
              <PageHeader title="Checkout" description={`Ticket ${s.ticketNumber}`} />
              <Card className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="plate text-3xl">{s.vehicle.displayPlate}</span><StatusBadge status={s.status} /></div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-muted">Vehicle</dt><dd>{vehicleTypeLabel(s.vehicle.vehicleType)}</dd></div>
                  <div><dt className="text-muted">Space</dt><dd className="font-semibold">{s.slot.slotNumber}</dd></div>
                  <div><dt className="text-muted">Entered</dt><dd><Timestamp iso={s.entryTime} /></dd></div>
                  <div><dt className="text-muted">{s.status === 'ACTIVE' ? 'Parked so far' : 'Duration'}</dt><dd>{s.status === 'ACTIVE' ? <ElapsedTimer entryTime={s.entryTime} /> : '(see fee)'}</dd></div>
                </dl>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="mb-1 text-xs text-muted">Entry photo</p><SecurePhoto photo={s.entryPhoto} alt={`Entry photo of ${s.vehicle.displayPlate}`} label="Entry photo" className="aspect-[4/3] w-full" /></div>
                  {s.exitPhoto && <div><p className="mb-1 text-xs text-muted">Exit photo</p><SecurePhoto photo={s.exitPhoto} alt={`Exit photo of ${s.vehicle.displayPlate}`} label="Exit photo" className="aspect-[4/3] w-full" /></div>}
                </div>
              </Card>

              {s.status === 'ACTIVE' && (
                actions.includes('CHECKOUT') ? (
                  <Card className="space-y-4">
                    <CardTitle>Confirm exit</CardTitle>
                    <label className="flex min-h-12 items-center gap-3 rounded-md border border-line bg-surface2 px-3.5">
                      <input type="checkbox" className="size-5 accent-[var(--accent)]" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                      <span className="text-sm">This is the correct vehicle (plate and photo match).</span>
                    </label>
                    {confirmed && <CameraCapture captureType="EXIT" lotId={s.lotId} value={photo} onChange={setPhoto} instruction="Capture the vehicle as it leaves." />}
                    {checkout.error && <Alert tone={checkout.error.kind === 'network' ? 'warning' : 'danger'} live>{checkout.error.message}</Alert>}
                    {!online && <Alert tone="warning">{MSG.offline}</Alert>}
                    <Button size="lg" className="w-full" icon={Calculator} loading={checkout.isSubmitting} disabled={!confirmed || !photo?.ref || !online} onClick={() => checkout.mutate()}>Record exit and calculate fee</Button>
                    <p className="text-center text-xs text-muted">The exit time and the fee are set by the server.</p>
                  </Card>
                ) : <Alert tone="info">You can view this session but not check it out.</Alert>
              )}

              {['EXIT_PENDING', 'PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(s.status) && co && (
                <>
                  <Card><CardTitle>Fee summary</CardTitle><FeeReview checkout={co} /></Card>
                  <Card>
                    <CardTitle>Payment</CardTitle>
                    {co.total === 0 ? (
                      <div className="space-y-3"><Alert tone="info" title="No fee due">The stay is within the free period.</Alert>{actions.includes('COMPLETE') ? <Button size="lg" className="w-full" onClick={() => setFreeOpen(true)}>Complete session (no fee)</Button> : <p className="text-sm text-muted">A manager can complete this session.</p>}</div>
                    ) : actions.includes('PAY') || s.status === 'PAYMENT_PENDING' ? <PaymentPanel session={s} checkout={co} />
                      : <Alert tone="info">You do not have permission to take payment for this session.</Alert>}
                  </Card>
                </>
              )}

              {s.status === 'COMPLETED' && <Card className="space-y-3"><PaymentConfirmed session={s} /><SlotReleased session={s} /></Card>}
              {s.status === 'CANCELLED' && <Alert tone="info">This session was cancelled.</Alert>}
              {s.status === 'DISPUTED' && <Alert tone="danger" title="Manager needed">This session is disputed. A manager must resolve it.</Alert>}
              <ConfirmDialog open={freeOpen} onClose={() => setFreeOpen(false)} title="Complete without a fee?" description="The space will be released." confirmLabel="Complete session" loading={complete.isSubmitting} error={complete.error} onConfirm={() => complete.mutate('No fee due (within grace period)')} />
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
