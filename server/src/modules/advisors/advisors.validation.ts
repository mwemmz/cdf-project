import { z } from 'zod';

export const ADVISOR_SPECIALTIES = ['business_plans', 'feasibility', 'accounting', 'marketing'] as const;

export const createAdvisorProfileSchema = z.object({
  specialty: z.enum(ADVISOR_SPECIALTIES, {
    errorMap: () => ({ message: 'Specialty must be one of: business_plans, feasibility, accounting, marketing' }),
  }),
  bio: z.string().min(20, 'Tell applicants a bit about yourself (at least 20 characters)').max(1000),
  pricePerSession: z.number().positive('Price per session must be greater than 0'),
});