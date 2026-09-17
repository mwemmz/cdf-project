import { Request, Response } from 'express';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { APPLICATION_TRANSITIONS, assertTransition } from './applicationFlow';

const applicationInclude = {
  opportunity: true,
  businessPlan: { include: { feasibilityScore: true } },
  repayments: { orderBy: { date: 'desc' } },
} satisfies Prisma.ApplicationInclude;

export async function createApplication(req: Request, res: Response) {
  const applicantId = req.auth!.userId;
  const { businessPlanId } = req.body;

  const plan = await prisma.businessPlan.findUnique({
    where: { id: businessPlanId },
    include: { feasibilityScore: true, application: true },
  });
  if (!plan) throw badRequest('Business plan not found');
  if (plan.applicantId !== applicantId) throw forbidden('This business plan does not belong to you');
  if (plan.application) throw badRequest('This business plan already has an application');
  if (!plan.feasibilityScore) {
    throw badRequest('Add a feasibility score to this plan before submitting an application');
  }

  const application = await prisma.application.create({
    data: {
      applicantId,
      opportunityId: plan.opportunityId,
      businessPlanId: plan.id,
      status: ApplicationStatus.SUBMITTED,
    },
    include: applicationInclude,
  });

  res.status(201).json({ success: true, data: application });
}

export async function listMyApplications(req: Request, res: Response) {
  const applications = await prisma.application.findMany({
    where: { applicantId: req.auth!.userId },
    include: applicationInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: applications });
}

export async function getApplication(req: Request, res: Response) {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: applicationInclude,
  });
  if (!application) throw notFound('Application not found');
  const isOwner = application.applicantId === req.auth!.userId;
  const isAdmin = req.auth!.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw forbidden('You do not have access to this application');
  res.json({
    success: true,
    data: {
      ...application,
      allowedTransitions: APPLICATION_TRANSITIONS[application.status],
    },
  });
}

export async function updateApplicationStatus(req: Request, res: Response) {
  const { status, amountDisbursed } = req.body;
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: { businessPlan: true },
  });
  if (!application) throw notFound('Application not found');

  if (application.status !== status) {
    try {
      assertTransition(application.status, status as ApplicationStatus);
    } catch (err) {
      throw badRequest((err as Error).message);
    }
  }

  const data: Prisma.ApplicationUpdateInput = { status };
  if (status === ApplicationStatus.DISBURSED) {
    const disbursed = amountDisbursed ?? application.businessPlan.amountRequested;
    if (disbursed <= 0) throw badRequest('Amount disbursed must be greater than 0');
    data.amountDisbursed = disbursed;
  }
  if (status === ApplicationStatus.REPAYING && !application.amountDisbursed) {
    data.amountDisbursed = application.businessPlan.amountRequested;
  }

  const updated = await prisma.application.update({
    where: { id: application.id },
    data,
    include: applicationInclude,
  });

  res.json({ success: true, data: updated });
}