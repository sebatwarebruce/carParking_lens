import { z } from 'zod';
export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone number'),
  password: z.string().min(1, 'Enter your password'),
});
export const forgotSchema = z.object({ identifier: z.string().trim().min(3, 'Enter your email or phone number') });
