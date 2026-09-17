import { Request, Response } from 'express';
import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { computeRepaymentSummary } from '../repayments/repaymentSummary';

// Recomputed from stored data on every call — nothing is cached, so the
// dashboard always reflects the current state of the platform.
export async function getSummary(_req: Request, res: Response) {
  const applications = await prisma.application.findMany({
    select: {
      status: true,
      amountDisbursed: true,
      businessPlan: { select: { amountRequested: true } },
      repayments: { select: { amount: true } },
    },
  });

  const byStage: Record<ApplicationStatus, number> = {
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
    DISBURSED: 0,
    REPAYING: 0,
    CLOSED: 0,
  };

  let requested = 0;
  let disbursed = 0;
  let repaid = 0;
  for (const application of applications) {
    byStage[application.status] += 1;
    requested += application.businessPlan.amountRequested;
    disbursed += application.amountDisbursed ?? 0;
    repaid += application.repayments.reduce((sum, repayment) => sum + repayment.amount, 0);
  }

  const [advisorsAwaitingVerification, opportunities] = await Promise.all([
    prisma.advisorProfile.count({ where: { verified: false } }),
    prisma.opportunity.count(),
  ]);

  // Reuses the shared repayment summary so the admin's outstanding figure can
  // never disagree with an applicant's own balance calculation.
  const repayment = computeRepaymentSummary(disbursed, repaid);

  res.json({
    success: true,
    data: {
      applications: { total: applications.length, byStage },
      money: {
        requested,
        disbursed,
        repaid,
        outstanding: repayment.remainingBalance,
      },
      advisorsAwaitingVerification,
      opportunities,
    },
  });
}
