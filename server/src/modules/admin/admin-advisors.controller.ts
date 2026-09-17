import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../utils/errors';

export async function listAdvisors(_req: Request, res: Response) {
  const advisors = await prisma.advisorProfile.findMany({
    // Unlike the public marketplace, the admin sees EVERY advisor — including
    // the unverified ones nobody else can see. Unverified first, so the
    // verification queue is always at the top.
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: [{ verified: 'asc' }, { id: 'asc' }],
  });
  res.json({ success: true, data: advisors });
}

export const setAdvisorVerificationSchema = z.object({ verified: z.boolean() });

export async function setAdvisorVerification(req: Request, res: Response) {
  const parsed = setAdvisorVerificationSchema.parse(req.body);
  const existing = await prisma.advisorProfile.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Advisor profile not found');

  // Idempotent by design: setting the same value twice is a no-op, not an error.
  const profile = await prisma.advisorProfile.update({
    where: { id: req.params.id },
    data: { verified: parsed.verified },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
  });
  res.json({ success: true, data: profile });
}
