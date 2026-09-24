import { z } from 'zod';

export const bookingIdParamSchema = z.object({
  bookingId: z.string().min(1, 'Booking id is required'),
});

export const messageBodySchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
});