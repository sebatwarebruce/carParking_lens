import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BadgeCheck, Share2 } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Card from '@/components/ui/Card.jsx';
import QrTicket, { ticketUrl } from '@/components/common/QrTicket.jsx';
import SecurePhoto from '@/components/common/SecurePhoto.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import { useToast } from '@/app/providers/ToastProvider.jsx';
import { MSG } from '@/constants/messages.js';
import { vehicleTypeLabel } from '@/constants/vehicleTypes.js';

/** Shown only after the server returned 201 with a ticket number and entry time. */
export default function TicketSuccess({ session, onNew }) {
  const toast = useToast();
  const share = async () => {
    const url = ticketUrl(session.ticketNumber);
    const text = `Parking ticket ${session.ticketNumber}. Plate ${session.vehicle.displayPlate}, space ${session.slot.slotNumber}.`;
    try {
      if (navigator.share) await navigator.share({ title: 'Parking ticket', text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); toast.success('Ticket link copied.'); }
    } catch { /* user cancelled */ }
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <span className="grid size-16 place-items-center rounded-full border border-success/50 bg-success/10 text-success"><BadgeCheck size={34} aria-hidden /></span>
        <h1 className="font-display text-2xl">{MSG.entrySaved}</h1>
        <p className="text-sm text-muted">Space {session.slot.slotNumber} is now occupied.</p>
      </div>
      <Card raised className="space-y-4 text-center">
        <p className="text-xs text-muted">Ticket number</p>
        <p className="plate break-all text-2xl">{session.ticketNumber}</p>
        <div className="flex justify-center"><QrTicket ticketNumber={session.ticketNumber} /></div>
        <dl className="grid grid-cols-2 gap-3 text-left text-sm">
          <div><dt className="text-muted">Plate</dt><dd className="plate text-base">{session.vehicle.displayPlate}</dd></div>
          <div><dt className="text-muted">Vehicle</dt><dd>{vehicleTypeLabel(session.vehicle.vehicleType)}</dd></div>
          <div><dt className="text-muted">Space</dt><dd className="font-semibold">{session.slot.slotNumber}</dd></div>
          <div><dt className="text-muted">Entry time</dt><dd><Timestamp iso={session.entryTime} /></dd></div>
        </dl>
        {session.entryPhoto && <SecurePhoto photo={session.entryPhoto} alt={`Entry photo of ${session.vehicle.displayPlate}`} className="mx-auto aspect-[4/3] w-full max-w-xs" label="Entry photo" />}
      </Card>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant="secondary" icon={Share2} onClick={share}>Share ticket</Button>
        <Button as={Link} to={`/sessions/${session.id}`} variant="secondary">View session</Button>
        <Button onClick={onNew}>New entry</Button>
      </div>
    </motion.div>
  );
}
