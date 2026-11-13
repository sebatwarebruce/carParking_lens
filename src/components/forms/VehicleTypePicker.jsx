import { VEHICLE_TYPES } from '@/constants/vehicleTypes.js';
import { ICONS } from '@/constants/icons.js';
import { clsx } from '@/utils/format.js';

export default function VehicleTypePicker({ value, onChange, invalid, name = 'Vehicle type' }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-4 gap-2">
      {VEHICLE_TYPES.map((t) => {
        const Icon = ICONS.vehicle[t.value]; const on = value === t.value;
        return (
          <button key={t.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(t.value)}
            className={clsx('neu-key flex min-h-[72px] flex-col items-center justify-center gap-1 px-1 text-sm', on ? 'border-accent-text text-accent-text font-semibold' : 'text-ink', invalid && 'border-danger')} aria-pressed={on}>
            <Icon size={22} strokeWidth={1.75} aria-hidden />{t.label}
          </button>
        );
      })}
    </div>
  );
}
