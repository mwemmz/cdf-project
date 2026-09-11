import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  role: z
    .enum([Role.APPLICANT, Role.ADVISOR])
    .default(Role.APPLICANT)
    .refine((v) => v === Role.APPLICANT || v === Role.ADVISOR, {
      message: 'Only applicant and advisor registration is allowed',
    }),
});

export const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});