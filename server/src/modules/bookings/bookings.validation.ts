import { z } from 'zod';

export const createBookingSchema = z.object({
  advisorId: z.string().min(1, 'Advisor is required'),
  note: z.string().max(1000).optional().or(z.literal('')),
});

export const bookingIdParamSchema = z.object({
  id: z.string().min(1),
});