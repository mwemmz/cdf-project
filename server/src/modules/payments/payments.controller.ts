import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, TransactionKind } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import {
  ADVISOR_COMMISSION_RATE,
  ASSESSMENT_FEE_ZMW,
  MARKETPLACE_COMMISSION_RATE,
  splitAmount,
} from './fees';

const txInclude = {
  payer: { select: { id: true, name: true } },
  payee: { select: { id: true, name: true } },
} as const;

// Records a simulated advisor-session payment inside the caller's transaction.
export async function recordAdvisorSession(
  tx: Prisma.TransactionClient,
  booking: { id: string; applicantId: string; advisorId: string; price: number },
) {
  const { commissionAmount, netAmount } = splitAmount(booking.price, ADVISOR_COMMISSION_RATE);
  return tx.transaction.create({
    data: {
      kind: TransactionKind.ADVISOR_SESSION,
      payerId: booking.applicantId,
      payeeId: booking.advisorId,
      grossAmount: booking.price,
      commissionRate: ADVISOR_COMMISSION_RATE,
      commissionAmount,
      netAmount,
      referenceId: booking.id,
      description: 'Advisor session',
    },
  });
}

export const buyProductSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(100).default(1),
});

export async function buyProduct(req: Request, res: Response) {
  const { productId, quantity } = buyProductSchema.parse(req.body);
  const buyerId = req.auth!.userId;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw notFound('Product not found');
  if (product.applicantId === buyerId) throw badRequest('You cannot buy your own product');

  const gross = Math.round(product.price * quantity * 100) / 100;
  const { commissionAmount, netAmount } = splitAmount(gross, MARKETPLACE_COMMISSION_RATE);
  const txn = await prisma.transaction.create({
    data: {
      kind: TransactionKind.MARKETPLACE_SALE,
      payerId: buyerId,
      payeeId: product.applicantId,
      grossAmount: gross,
      commissionRate: MARKETPLACE_COMMISSION_RATE,
      commissionAmount,
      netAmount,
      referenceId: product.id,
      description: `${quantity} × ${product.name}`,
    },
    include: txInclude,
  });
  res.status(201).json({ success: true, data: txn });
}

export const assessmentSchema = z.object({ businessPlanId: z.string().min(1) });

// The business owner pays FundPath for a plan + risk and market assessment.
export async function payForAssessment(req: Request, res: Response) {
  const { businessPlanId } = assessmentSchema.parse(req.body);
  const userId = req.auth!.userId;
  const plan = await prisma.businessPlan.findUnique({ where: { id: businessPlanId } });
  if (!plan) throw notFound('Business plan not found');
  if (plan.applicantId !== userId) throw forbidden('You do not own this business plan');

  const existing = await prisma.transaction.findFirst({
    where: { kind: TransactionKind.PLAN_ASSESSMENT, referenceId: plan.id },
    include: txInclude,
  });
  if (existing) return res.json({ success: true, data: existing });

  const txn = await prisma.transaction.create({
    data: {
      kind: TransactionKind.PLAN_ASSESSMENT,
      payerId: userId,
      payeeId: null,
      grossAmount: ASSESSMENT_FEE_ZMW,
      commissionRate: 1,
      commissionAmount: ASSESSMENT_FEE_ZMW,
      netAmount: 0,
      referenceId: plan.id,
      description: 'Plan, risk and market assessment',
    },
    include: txInclude,
  });
  res.status(201).json({ success: true, data: txn });
}

// Everything the signed-in user paid or earned.
export async function listMyTransactions(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const rows = await prisma.transaction.findMany({
    where: { OR: [{ payerId: userId }, { payeeId: userId }] },
    include: txInclude,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: rows });
}

// Which of the user's plans already have a paid assessment.
export async function listPaidAssessments(req: Request, res: Response) {
  const rows = await prisma.transaction.findMany({
    where: { kind: TransactionKind.PLAN_ASSESSMENT, payerId: req.auth!.userId },
    select: { referenceId: true },
  });
  res.json({ success: true, data: rows.map((r) => r.referenceId) });
}

// Admin: simulated revenue summary.
export async function revenueSummary(_req: Request, res: Response) {
  const [grouped, recent] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['kind'],
      _sum: { grossAmount: true, commissionAmount: true },
      _count: { id: true },
    }),
    prisma.transaction.findMany({ include: txInclude, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);
  const byKind = grouped.map((g) => ({
    kind: g.kind,
    count: g._count.id,
    gross: g._sum.grossAmount ?? 0,
    commission: g._sum.commissionAmount ?? 0,
  }));
  res.json({
    success: true,
    data: {
      totalGross: byKind.reduce((s, k) => s + k.gross, 0),
      totalCommission: byKind.reduce((s, k) => s + k.commission, 0),
      byKind,
      recent,
      rates: {
        advisor: ADVISOR_COMMISSION_RATE,
        marketplace: MARKETPLACE_COMMISSION_RATE,
        assessmentFee: ASSESSMENT_FEE_ZMW,
      },
    },
  });
}
