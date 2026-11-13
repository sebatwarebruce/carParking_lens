import { z } from 'zod';
export const staffSchema = z.object({
  name: z.string().trim().min(2, 'Enter the full name'),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')),
  phone: z.string().trim().regex(/^(\+?\d{9,15})?$/, 'Enter a valid phone number').optional(),
  role: z.enum(['PARKING_OWNER', 'MANAGER', 'ATTENDANT', 'CASHIER']),
  lotIds: z.array(z.string()).optional(),
}).refine((v) => v.email || v.phone, { message: 'Enter an email or a phone number', path: ['email'] });
