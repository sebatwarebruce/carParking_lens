import { ICONS } from '@/constants/icons.js';
import { SLOT_STATUS } from '@/constants/statuses.js';
import { vehicleTypeLabel } from '@/constants/vehicleTypes.js';
import { clsx } from '@/utils/format.js';

/** Slot status = icon + text + colour border. Selected state is a ring, not a colour change alone. */
export default function SlotTile({ slot, onClick, selected, disabled }) {
  const st = SLOT_STATUS[slot.status];
  const VIcon = ICONS.vehicle[slot.vehicleType] || ICONS.vehicle.ANY;
  return (
    <button type="button" onClick={() => onClick?.(slot)} disabled={disabled} aria-pressed={selected} aria-label={`Space ${slot.slotNumber}, ${st.label}, ${vehicleTypeLabel(slot.vehicleType)}${slot.currentSession ? `, ${slot.currentSession.plateNumber}` : ''}`}
      className={clsx('neu-key relative flex min-h-[92px] flex-col items-start justify-between p-2.5 text-left transition-transform', selected && 'ring-2 ring-accent-text', disabled && 'opacity-55', slot.status === 'OUT_OF_SERVICE' && 'border-dashed')}>
      <span className="flex w-full items-center justify-between"><span className="plate text-base leading-none">{slot.slotNumber}</span><VIcon size={16} className="text-muted" aria-hidden /></span>
      <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold', `text-${st.tone === 'neutral' ? 'muted' : st.tone}`)}><st.icon size={14} aria-hidden />{st.label}</span>
      {slot.currentSession && <span className="plate w-full truncate text-xs text-muted">{slot.currentSession.plateNumber}</span>}
    </button>
  );
}
