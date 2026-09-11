import { z } from 'zod';

export const createRepaymentSchema = z.object({
  applicationId: z.string().min(1, 'Application is required'),
  amount: z.number().positive('Repayment amount must be greater than 0'),
  date: z.coerce.date().optional(),
  note: z.string().max(1000).optional().or(z.literal('')),
});

export const applicationIdParamSchema = z.object({
  applicationId: z.string().min(1),
});