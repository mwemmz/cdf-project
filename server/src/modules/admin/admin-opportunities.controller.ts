import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../utils/errors';

export const createOpportunitySchema = z.object({
  constituencyName: z.string().trim().min(1, 'Constituency is required'),
  category: z.string().trim().min(1, 'Category is required'),
  amountAvailable: z.coerce.number().positive('Amount must be a positive number'),
  deadline: z.coerce.date(),
});

export const updateOpportunitySchema = createOpportunitySchema.partial();

export async function createOpportunity(req: Request, res: Response) {
  const { constituencyName, category, amountAvailable, deadline } = req.body as z.infer<
    typeof createOpportunitySchema
  >;
  const created = await prisma.opportunity.create({
    data: { constituencyName, category, amountAvailable, deadline },
  });
  res.status(201).json({ success: true, data: created });
}

export async function updateOpportunity(req: Request, res: Response) {
  const existing = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Opportunity not found');

  const data = req.body as Partial<z.infer<typeof createOpportunitySchema>>;
  const updated = await prisma.opportunity.update({
    where: { id: req.params.id },
    data: {
      ...(data.constituencyName !== undefined ? { constituencyName: data.constituencyName } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.amountAvailable !== undefined ? { amountAvailable: data.amountAvailable } : {}),
      ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
    },
  });
  res.json({ success: true, data: updated });
}
