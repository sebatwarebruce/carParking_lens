import { z } from 'zod';

const phone = z.string().trim().transform((v) => v.replace(/[\s-]/g, '')).refine((v) => v === '' || /^\+?\d{9,15}$/.test(v), 'Enter a valid phone number, e.g. 078 123 4567');

/** Validation for UX only; the server validates again. `requirePhone` comes from GET /settings/policy (Q-02). */
export const entrySchema = ({ requirePhone = true } = {}) =>
  z.object({
    plateNumber: z.string().trim().min(2, 'Enter the plate number').max(14, 'Plate is too long').regex(/^[A-Za-z0-9 -]+$/, 'Use letters, numbers, spaces or dashes'),
    vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK', 'OTHER'], { errorMap: () => ({ message: 'Choose a vehicle type' }) }),
    customerPhone: requirePhone ? phone.refine((v) => v.length > 0, 'Enter the customer phone') : phone,
    ownerName: z.string().trim().max(120).optional(),
  });
