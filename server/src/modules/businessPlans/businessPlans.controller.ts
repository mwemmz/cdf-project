import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { scoreFeasibility } from '../feasibility/feasibilityEngine';
import { NotificationType } from '@prisma/client';
import { notify } from '../notifications/notificationsLib';

const planInclude = {
  opportunity: true,
  feasibilityScore: true,
  application: { select: { id: true, status: true } },
  advisor: { select: { id: true, name: true } },
};

export async function createBusinessPlan(req: Request, res: Response) {
  const applicantId = req.auth!.userId;
  const data = req.body;

  const opportunity = await prisma.opportunity.findUnique({ where: { id: data.opportunityId } });
  if (!opportunity) throw badRequest('Selected opportunity does not exist');

  const plan = await prisma.businessPlan.create({
    data: {
      applicantId,
      opportunityId: data.opportunityId,
      businessIdea: data.businessIdea,
      targetMarket: data.targetMarket,
      startupCosts: data.startupCosts,
      revenueProjection: data.revenueProjection,
      amountRequested: data.amountRequested,
    },
  });

  const assessment = scoreFeasibility({
    businessIdea: data.businessIdea,
    targetMarket: data.targetMarket,
    startupCosts: data.startupCosts,
    revenueProjection: data.revenueProjection,
    amountRequested: data.amountRequested,
    amountAvailable: opportunity.amountAvailable,
  });

  const feasibilityScore = await prisma.feasibilityScore.upsert({
    where: { businessPlanId: plan.id },
    update: assessment,
    create: { businessPlanId: plan.id, ...assessment },
  });

  await notify(
    applicantId,
    NotificationType.FEASIBILITY_READY,
    `Your feasibility score is ready: ${feasibilityScore.score}/100 (${feasibilityScore.category}).`,
  );

  res.status(201).json({
    success: true,
    data: { plan, feasibilityScore },
  });
}

export async function listMyPlans(req: Request, res: Response) {
  const plans = await prisma.businessPlan.findMany({
    where: { applicantId: req.auth!.userId },
    include: planInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: plans });
}

export async function getPlan(req: Request, res: Response) {
  const plan = await prisma.businessPlan.findUnique({
    where: { id: req.params.id },
    include: planInclude,
  });
  if (!plan) throw notFound('Business plan not found');
  const isOwner = plan.applicantId === req.auth!.userId;
  const isLinkedAdvisor = plan.advisorId === req.auth!.userId;
  if (!isOwner && !isLinkedAdvisor && req.auth!.role !== 'ADMIN') {
    throw forbidden('You do not have access to this plan');
  }
  res.json({ success: true, data: plan });
}

export async function updatePlan(req: Request, res: Response) {
  const plan = await prisma.businessPlan.findUnique({
    where: { id: req.params.id },
    include: { opportunity: true },
  });
  if (!plan) throw notFound('Business plan not found');

  const isOwner = plan.applicantId === req.auth!.userId;
  const isLinkedAdvisor = plan.advisorId === req.auth!.userId;
  if (!isOwner && !isLinkedAdvisor && req.auth!.role !== 'ADMIN') {
    throw forbidden('You cannot edit this plan');
  }

  const data = req.body;
  const updated = await prisma.businessPlan.update({
    where: { id: plan.id },
    data: {
      ...(data.businessIdea !== undefined ? { businessIdea: data.businessIdea } : {}),
      ...(data.targetMarket !== undefined ? { targetMarket: data.targetMarket } : {}),
      ...(data.startupCosts !== undefined ? { startupCosts: data.startupCosts } : {}),
      ...(data.revenueProjection !== undefined ? { revenueProjection: data.revenueProjection } : {}),
      ...(data.amountRequested !== undefined ? { amountRequested: data.amountRequested } : {}),
    },
  });

  // The score depends on the numbers, so refresh it after any edit.
  const assessment = scoreFeasibility({
    businessIdea: updated.businessIdea,
    targetMarket: updated.targetMarket,
    startupCosts: updated.startupCosts,
    revenueProjection: updated.revenueProjection,
    amountRequested: updated.amountRequested,
    amountAvailable: plan.opportunity.amountAvailable,
  });
  const feasibilityScore = await prisma.feasibilityScore.upsert({
    where: { businessPlanId: plan.id },
    update: assessment,
    create: { businessPlanId: plan.id, ...assessment },
  });

  if (!isOwner) {
    await notify(
      plan.applicantId,
      NotificationType.FEASIBILITY_READY,
      `Your advisor updated your business plan. New feasibility score: ${feasibilityScore.score}/100 (${feasibilityScore.category}).`,
    );
  }

  res.json({ success: true, data: { plan: updated, feasibilityScore } });
}

export async function linkAdvisorToPlan(req: Request, res: Response) {
  const advisorId = req.auth!.userId;
  const plan = await prisma.businessPlan.findUnique({ where: { id: req.params.id } });
  if (!plan) throw notFound('Business plan not found');
  if (plan.advisorId === advisorId) throw badRequest('You are already linked to this plan');
  if (plan.advisorId) throw badRequest('Another advisor is already linked to this plan');

  const booking = await prisma.booking.findFirst({ where: { advisorId, applicantId: plan.applicantId } });
  if (!booking) throw forbidden('You can only co-edit plans of clients who have booked you');

  const updated = await prisma.businessPlan.update({
    where: { id: plan.id },
    data: { advisorId },
    include: planInclude,
  });
  res.json({ success: true, data: updated });
}

export async function unlinkAdvisorFromPlan(req: Request, res: Response) {
  const advisorId = req.auth!.userId;
  const plan = await prisma.businessPlan.findUnique({ where: { id: req.params.id } });
  if (!plan) throw notFound('Business plan not found');
  if (plan.advisorId !== advisorId) throw forbidden('You are not linked to this plan');

  const updated = await prisma.businessPlan.update({
    where: { id: plan.id },
    data: { advisorId: null },
    include: planInclude,
  });
  res.json({ success: true, data: updated });
}

export async function rescorePlan(req: Request, res: Response) {
  const plan = await prisma.businessPlan.findUnique({
    where: { id: req.params.id },
    include: { opportunity: true },
  });
  if (!plan) throw notFound('Business plan not found');
  if (plan.applicantId !== req.auth!.userId && req.auth!.role !== 'ADMIN') {
    throw forbidden('Only the owner can score this plan');
  }

  const assessment = scoreFeasibility({
    businessIdea: plan.businessIdea,
    targetMarket: plan.targetMarket,
    startupCosts: plan.startupCosts,
    revenueProjection: plan.revenueProjection,
    amountRequested: plan.amountRequested,
    amountAvailable: plan.opportunity.amountAvailable,
  });

  const feasibilityScore = await prisma.feasibilityScore.upsert({
    where: { businessPlanId: plan.id },
    update: assessment,
    create: { businessPlanId: plan.id, ...assessment },
  });

  await notify(
    plan.applicantId,
    NotificationType.FEASIBILITY_READY,
    `Your business plan was re-scored: ${feasibilityScore.score}/100 (${feasibilityScore.category}).`,
  );

  res.json({ success: true, data: feasibilityScore });
}