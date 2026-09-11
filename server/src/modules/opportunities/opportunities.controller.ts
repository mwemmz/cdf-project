import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../utils/errors';

export async function listOpportunities(_req: Request, res: Response) {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { deadline: 'asc' },
  });
  res.json({ success: true, data: opportunities });
}

export async function getOpportunity(req: Request, res: Response) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: req.params.id },
  });
  if (!opportunity) throw notFound('Opportunity not found');
  res.json({ success: true, data: opportunity });
}