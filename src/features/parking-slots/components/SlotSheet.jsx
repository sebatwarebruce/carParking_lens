import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import ConfirmDialog from '@/components/common/ConfirmDialog.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { useToast } from '@/app/providers/ToastProvider.jsx';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { parkingService } from '@/services/parkingService.js';
import { vehicleTypeLabel } from '@/constants/vehicleTypes.js';
import { P } from '@/constants/permissions.js';
import { slotKeys } from '../hooks/useSlots.js';

export default function SlotSheet({ slot, onClose }) {
  const { can } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(null); // 'oos' | 'restore'
  const m = useGuardedMutation((vars) => parkingService.updateSlot(slot.id, vars), {
    onSuccess: () => { qc.invalidateQueries({ queryKey: slotKeys.all }); toast.success('Space updated.'); setConfirm(null); onClose(); },
  });
  if (!slot) return null;
  const canManage = can(P.SLOTS_MANAGE) && slot.status !== 'OCCUPIED';
  return (
    <>
      <Modal open={!!slot && !confirm} onClose={onClose} variant="sheet" title={`Space ${slot.slotNumber}`} description={`${slot.zone ?? 'No zone'} (${vehicleTypeLabel(slot.vehicleType)})`}>
        <div className="space-y-4">
          <StatusBadge kind="slot" status={slot.status} />
          {slot.status === 'OUT_OF_SERVICE' && <p className="text-sm text-muted">Reason: <span className="text-ink">{slot.outOfServiceReason || 'Not recorded'}</span></p>}
          {slot.currentSession && (
            <div className="rounded-md border border-line bg-surface2 p-3 text-sm"><p className="plate text-lg">{slot.currentSession.plateNumber}</p><p className="font-mono text-xs text-muted">{slot.currentSession.ticketNumber}</p><Link to={`/sessions/${slot.currentSession.id}`} className="mt-2 inline-block text-accent-text hover:underline">Open session</Link></div>
          )}
          {canManage && (slot.status === 'AVAILABLE'
            ? <Button variant="danger" className="w-full" onClick={() => setConfirm('oos')}>Mark out of service</Button>
            : <Button className="w-full" onClick={() => setConfirm('restore')}>Return to service</Button>)}
          {can(P.SLOTS_MANAGE) && slot.status === 'OCCUPIED' && <p className="text-sm text-muted">Occupied spaces are released only when the parking session is completed.</p>}
        </div>
      </Modal>
      <ConfirmDialog open={confirm === 'oos'} onClose={() => setConfirm(null)} title="Mark space out of service?" description="Attendants will not be able to assign this space until it is returned to service." requireReason confirmLabel="Mark out of service" tone="danger" loading={m.isSubmitting} error={m.error} onConfirm={(reason) => m.mutate({ status: 'OUT_OF_SERVICE', reason })} />
      <ConfirmDialog open={confirm === 'restore'} onClose={() => setConfirm(null)} title="Return space to service?" confirmLabel="Return to service" requireReason reasonLabel="Note" loading={m.isSubmitting} error={m.error} onConfirm={(reason) => m.mutate({ status: 'AVAILABLE', reason })} />
    </>
  );
}
