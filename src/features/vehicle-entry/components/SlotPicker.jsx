import { RefreshCw } from 'lucide-react';
import { slotFits, vehicleTypeLabel } from '@/constants/vehicleTypes.js';
import { useSlots } from '@/features/parking-slots/hooks/useSlots.js';
import SlotTile from '@/features/parking-slots/components/SlotTile.jsx';
import { QueryState, EmptyState } from '@/components/feedback/States.jsx';
import Button from '@/components/ui/Button.jsx';
import { motion } from 'motion/react';

/** Offers ONLY available spaces that fit the chosen vehicle type. The server still re-checks (slot conflicts are handled by the page). */
export default function SlotPicker({ lotId, vehicleType, value, onChange }) {
  const q = useSlots(lotId, { status: 'AVAILABLE' }, { refetchInterval: 8_000 });
  return (
    <QueryState query={q} rows={3}>
      {(slots) => {
        const fits = slots.filter((s) => slotFits(s.vehicleType, vehicleType));
        const sel = fits.find((s) => s.id === value);
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted"><span className="font-semibold text-ink tabular">{fits.length}</span> available for {vehicleTypeLabel(vehicleType).toLowerCase()}</p>
              <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => q.refetch()} loading={q.isFetching}>Refresh</Button>
            </div>
            {value && !sel && <p role="alert" className="text-sm text-danger">Your selected space is no longer available. Choose another.</p>}
            {fits.length === 0 ? <EmptyState title="No free space fits this vehicle">Try again in a moment, or ask a manager.</EmptyState> : (
              <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5" role="radiogroup" aria-label="Available spaces">
                {fits.map((s) => <motion.li key={s.id} layout role="presentation"><SlotTile slot={s} selected={s.id === value} onClick={() => onChange(s.id === value ? null : s.id)} /></motion.li>)}
              </ul>
            )}
          </div>
        );
      }}
    </QueryState>
  );
}
