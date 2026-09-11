import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(120),
  description: z.string().min(10, 'Describe your product in at least 10 characters').max(2000),
  price: z.number().positive('Price must be greater than 0'),
  imageUrl: z
    .string()
    .url('A valid image URL is required')
    .optional()
    .or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial();

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});