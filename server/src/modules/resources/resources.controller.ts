import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../utils/errors';

export async function listResources(req: Request, res: Response) {
  const { category } = req.query as { category?: string };
  const resources = await prisma.resource.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: resources });
}

export async function getResource(req: Request, res: Response) {
  const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
  if (!resource) throw notFound('Resource not found');
  res.json({ success: true, data: resource });
}