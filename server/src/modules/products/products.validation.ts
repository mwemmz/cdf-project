import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(120),
  description: z.string().min(10, 'Describe your product in at least 10 characters').max(2000),
  price: z.number().positive('Price must be greater than 0'),
  // Absolute URLs or app-relative paths (e.g. /placeholders/poultry.svg) — no
  // file upload handling, so the resolver accepts either form.
  imageUrl: z.string().min(1).max(500).optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial();

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});