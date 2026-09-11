import { z } from 'zod';

export const createApplicationSchema = z.object({
  businessPlanId: z.string().min(1, 'Business plan is required'),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'REPAYING', 'CLOSED']),
  amountDisbursed: z.number().positive('Amount disbursed must be greater than 0').optional(),
});