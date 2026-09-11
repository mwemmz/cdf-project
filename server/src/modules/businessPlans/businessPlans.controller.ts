import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { scoreFeasibility } from '../feasibility/feasibilityEngine';

const planInclude = {
  opportunity: true,
  feasibilityScore: true,
  application: { select: { id: true, status: true } },
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
  if (plan.applicantId !== req.auth!.userId && req.auth!.role !== 'ADMIN') {
    throw forbidden('You do not have access to this plan');
  }
  res.json({ success: true, data: plan });
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

  res.json({ success: true, data: feasibilityScore });
}