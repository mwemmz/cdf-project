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
      businessPlan: {
        select: { amountRequested: true, feasibilityScore: { select: { category: true } } },
      },
      opportunity: { select: { constituencyName: true } },
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

  // Feasibility distribution over plans that actually have an application —
  // scored plans that were never submitted don't appear on the dashboard.
  const feasibility: Record<string, number> = { High: 0, Medium: 0, Low: 0 };

  // Demand is reported per constituency using the opportunity's public name,
  // so the chart labels match what applicants saw when they applied.
  const demandCounts = new Map<string, number>();

  for (const application of applications) {
    const category = application.businessPlan.feasibilityScore?.category;
    if (category) feasibility[category] = (feasibility[category] ?? 0) + 1;
    const constituency = application.opportunity.constituencyName;
    demandCounts.set(constituency, (demandCounts.get(constituency) ?? 0) + 1);
  }

  const demandByConstituency = [...demandCounts.entries()]
    .map(([constituencyName, count]) => ({ constituencyName, applications: count }))
    .sort((a, b) => b.applications - a.applications || a.constituencyName.localeCompare(b.constituencyName));

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
      feasibility,
      demandByConstituency,
    },
  });
}

// The admin's queue: every application on the platform, from every applicant —
// unlike the applicant-facing list, which scopes to the signed-in user.
export async function listApplications(req: Request, res: Response) {
  const status = req.query.status as ApplicationStatus | undefined;

  const applications = await prisma.application.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      applicant: { select: { name: true, email: true } },
      opportunity: { select: { constituencyName: true, category: true } },
      businessPlan: { select: { amountRequested: true } },
    },
  });

  res.json({ success: true, data: applications });
}
