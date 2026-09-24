import { z } from 'zod';

export const resourceQuerySchema = z.object({
  category: z.string().min(1).max(80).optional(),
});

export const resourceIdParamSchema = z.object({
  id: z.string().min(1, 'Resource id is required'),
});