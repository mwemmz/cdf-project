import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking id is required'),
  rating: z.number().int('Rating must be a whole number').min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment is too long').optional(),
});

export const advisorIdParamSchema = z.object({
  advisorId: z.string().min(1, 'Advisor id is required'),
});