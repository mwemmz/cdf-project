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

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function getMyClients(req: Request, res: Response) {
  const advisorId = req.auth!.userId;

  const bookings = await prisma.booking.findMany({
    where: { advisorId },
    include: { applicant: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  type ClientInfo = {
    applicant: { id: string; name: string; email: string };
    bookings: number;
    sessionsCompleted: number;
  };
  const byClient = new Map<string, ClientInfo>();
  for (const b of bookings) {
    const entry = byClient.get(b.applicantId) ?? { applicant: b.applicant, bookings: 0, sessionsCompleted: 0 };
    entry.bookings += 1;
    if (b.status === 'PAID') entry.sessionsCompleted += 1;
    byClient.set(b.applicantId, entry);
  }

  const clientIds = [...byClient.keys()];
  const plans = clientIds.length
    ? await prisma.businessPlan.findMany({
        where: { applicantId: { in: clientIds } },
        include: { feasibilityScore: true, application: { select: { id: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const latestPlan = new Map<string, (typeof plans)[number]>();
  for (const p of plans) {
    if (!latestPlan.has(p.applicantId)) latestPlan.set(p.applicantId, p);
  }

  const clients = clientIds.map((id) => {
    const info = byClient.get(id)!;
    const plan = latestPlan.get(id);
    const planStatus = plan
      ? plan.application
        ? plan.application.status
        : plan.feasibilityScore
          ? 'SCORED'
          : 'DRAFT'
      : 'NO_PLAN';
    return {
      applicant: info.applicant,
      bookings: info.bookings,
      sessionsCompleted: info.sessionsCompleted,
      planId: plan?.id ?? null,
      planStatus,
      feasibilityScore: plan?.feasibilityScore?.score ?? null,
      feasibilityCategory: plan?.feasibilityScore?.category ?? null,
      applicationStatus: plan?.application?.status ?? null,
      linkedToMe: plan?.advisorId === advisorId,
    };
  });

  const scores = clients.map((c) => c.feasibilityScore).filter((s): s is number => s !== null);
  const averageFeasibilityScore = scores.length ? round1(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const sessionsCompleted = bookings.filter((b) => b.status === 'PAID').length;
  const repeatBookings = [...byClient.values()].reduce((sum, c) => sum + Math.max(0, c.bookings - 1), 0);
  const activeClients = clients.filter(
    (c) => c.applicationStatus === null || !['CLOSED', 'REJECTED'].includes(c.applicationStatus),
  ).length;

  res.json({
    success: true,
    data: {
      stats: {
        activeClients,
        totalClients: clients.length,
        averageFeasibilityScore,
        sessionsCompleted,
        repeatBookings,
      },
      clients,
    },
  });
}

export async function listAdvisors(_req: Request, res: Response) {
  const advisors = await prisma.advisorProfile.findMany({
    where: { verified: true },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { id: 'asc' },
  });

  const grouped = await prisma.review.groupBy({
    by: ['advisorId'],
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingByAdvisor = new Map(
    grouped.map((g) => [g.advisorId, { average: Math.round((g._avg.rating ?? 0) * 10) / 10, count: g._count.rating }]),
  );

  res.json({
    success: true,
    data: advisors.map((a) => ({ ...a, rating: ratingByAdvisor.get(a.userId) ?? { average: 0, count: 0 } })),
  });
}

export async function getAdvisor(req: Request, res: Response) {
  const profile = await prisma.advisorProfile.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
  });
  if (!profile) throw notFound('Advisor profile not found');

  const aggregate = await prisma.review.aggregate({
    where: { advisorId: profile.userId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  res.json({
    success: true,
    data: {
      ...profile,
      rating: {
        average: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
        count: aggregate._count.rating,
      },
    },
  });
}