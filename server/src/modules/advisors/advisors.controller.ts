import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { createAdvisorProfileSchema } from './advisors.validation';

export async function upsertMyProfile(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const parsed = createAdvisorProfileSchema.parse(req.body);

  const profile = await prisma.advisorProfile.upsert({
    where: { userId },
    update: {
      specialty: parsed.specialty,
      bio: parsed.bio,
      pricePerSession: parsed.pricePerSession,
    },
    create: {
      userId,
      specialty: parsed.specialty,
      bio: parsed.bio,
      pricePerSession: parsed.pricePerSession,
      verified: false,
    },
  });

  res.json({ success: true, data: profile });
}

export async function getMyProfile(req: Request, res: Response) {
  const profile = await prisma.advisorProfile.findUnique({
    where: { userId: req.auth!.userId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  res.json({ success: true, data: profile });
}

export async function listAdvisors(_req: Request, res: Response) {
  const advisors = await prisma.advisorProfile.findMany({
    where: { verified: true },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { id: 'asc' },
  });
  res.json({ success: true, data: advisors });
}

export async function getAdvisor(req: Request, res: Response) {
  const profile = await prisma.advisorProfile.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
  });
  if (!profile) throw notFound('Advisor profile not found');
  res.json({ success: true, data: profile });
}