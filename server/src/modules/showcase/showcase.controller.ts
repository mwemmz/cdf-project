import { Request, Response } from 'express';
import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { computeRepaymentSummary } from '../repayments/repaymentSummary';

const MIN_REPAYMENT_PERCENTAGE = 50;

function blurb(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

// Public: funded businesses in good repayment standing.
export async function listSuccessStories(_req: Request, res: Response) {
  const applications = await prisma.application.findMany({
    where: { status: { in: [ApplicationStatus.REPAYING, ApplicationStatus.CLOSED] } },
    include: {
      applicant: { select: { id: true, name: true } },
      opportunity: { select: { constituencyName: true, category: true } },
      businessPlan: { select: { businessIdea: true } },
      repayments: { select: { amount: true } },
    },
  });

  const applicantIds = [...new Set(applications.map((a) => a.applicantId))];
  const productCounts = applicantIds.length
    ? await prisma.product.groupBy({
        by: ['applicantId'],
        where: { applicantId: { in: applicantIds } },
        _count: { id: true },
      })
    : [];
  const countByApplicant = new Map(productCounts.map((p) => [p.applicantId, p._count.id]));

  const stories = applications
    .map((a) => {
      const totalRepaid = a.repayments.reduce((sum, r) => sum + r.amount, 0);
      const summary = computeRepaymentSummary(a.amountDisbursed ?? 0, totalRepaid);
      const productCount = countByApplicant.get(a.applicantId) ?? 0;
      return {
        id: a.id,
        applicantId: a.applicantId,
        applicantName: a.applicant.name,
        businessIdea: a.businessPlan.businessIdea,
        blurb: blurb(a.businessPlan.businessIdea),
        constituency: a.opportunity.constituencyName,
        category: a.opportunity.category,
        amountDisbursed: summary.totalDisbursed,
        totalRepaid: summary.totalRepaid,
        repaymentPercentage: summary.repaymentPercentage,
        status: a.status,
        hasStorefront: productCount > 0,
        productCount,
      };
    })
    .filter((s) => s.amountDisbursed > 0 && s.repaymentPercentage >= MIN_REPAYMENT_PERCENTAGE)
    .sort((a, b) => b.repaymentPercentage - a.repaymentPercentage);

  res.json({ success: true, data: stories });
}