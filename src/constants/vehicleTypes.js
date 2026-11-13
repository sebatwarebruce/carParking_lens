export const VEHICLE_TYPES = [
  { value: 'CAR', label: 'Car' },
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
  { value: 'TRUCK', label: 'Truck' },
  { value: 'OTHER', label: 'Other' },
];
export const SLOT_VEHICLE_TYPES = [...VEHICLE_TYPES.filter((v) => v.value !== 'OTHER'), { value: 'ANY', label: 'Any vehicle' }];
export const vehicleTypeLabel = (v) => [...VEHICLE_TYPES, { value: 'ANY', label: 'Any vehicle' }].find((t) => t.value === v)?.label ?? v;
// A slot fits a vehicle if types match or the slot accepts ANY. OTHER vehicles only fit ANY slots (Q-10).
export const slotFits = (slotType, vehicleType) => slotType === 'ANY' || slotType === vehicleType;
