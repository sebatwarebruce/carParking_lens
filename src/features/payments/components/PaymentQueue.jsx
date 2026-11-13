import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { usePaymentQueue } from '../hooks/usePayments.js';
import { QueryState, EmptyState } from '@/components/feedback/States.jsx';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import Money from '@/components/common/Money.jsx';
import { Timestamp } from '@/components/common/Time.jsx';

/** Sessions that have exited but are not yet settled. Cashiers open one to confirm cash or check mobile money. */
export default function PaymentQueue({ lotId }) {
  const q = usePaymentQueue({ lotId });
  return (
    <QueryState query={q} rows={3} isEmpty={(d) => !d.items.length} empty={<EmptyState title="Nothing waiting for payment">Vehicles that exit will appear here until payment is confirmed.</EmptyState>}>
      {(d) => (
        <ul className="space-y-2.5">
          {d.items.map((s) => (
            <li key={s.id}>
              <Link to={`/exit/${s.id}`} className="flex items-center gap-3 rounded-md border border-line bg-surface p-3.5 transition-colors hover:bg-surface2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="plate text-lg">{s.vehicle.displayPlate}</span><StatusBadge status={s.status} /></div>
                  <p className="mt-1 text-sm text-muted">Space {s.slot.slotNumber}, exited <Timestamp iso={s.exitTime} short /></p>
                </div>
                <div className="text-right"><p className="text-xs text-muted">Amount due</p><Money amount={s.amountDue} className="text-lg font-semibold" /></div>
                <ChevronRight size={18} className="text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </QueryState>
  );
}
