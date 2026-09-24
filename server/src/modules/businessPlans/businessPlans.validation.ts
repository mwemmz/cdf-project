import { z } from 'zod';

export const createBusinessPlanSchema = z.object({
  opportunityId: z.string().min(1, 'Opportunity is required'),
  businessIdea: z.string().min(30, 'Describe your business idea in at least 30 characters'),
  targetMarket: z.string().min(20, 'Describe your target market in at least 20 characters'),
  startupCosts: z.number().positive('Startup costs must be greater than 0'),
  revenueProjection: z.number().positive('Revenue projection must be greater than 0'),
  amountRequested: z.number().positive('Amount requested must be greater than 0'),
});

export const updateBusinessPlanSchema = createBusinessPlanSchema.omit({ opportunityId: true }).partial();

export const idParamSchema = z.object({
  id: z.string().min(1),
});