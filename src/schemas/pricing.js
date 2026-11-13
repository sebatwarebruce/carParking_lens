import { z } from 'zod';
const int = (label, min = 0) => z.coerce.number({ invalid_type_error: `Enter ${label}` }).int(`${label} must be a whole number`).min(min, min === 0 ? `${label} cannot be negative` : `${label} must be at least ${min}`);
export const pricingSchema = z.object({
  lotId: z.string().min(1, 'Choose a location'),
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK']),
  gracePeriodMinutes: int('Grace period'),
  firstBlockMinutes: int('First period (minutes)', 1),
  firstBlockPrice: int('First period price'),
  additionalBlockMinutes: int('Additional period (minutes)', 1),
  additionalBlockPrice: int('Additional period price'),
  dailyMaxPrice: z.union([z.literal(''), int('Daily maximum')]).optional(),
  effectiveFrom: z.string().min(1, 'Choose the date this starts'),
});
