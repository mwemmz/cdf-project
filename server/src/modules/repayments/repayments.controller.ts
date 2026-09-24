import { Request, Response } from 'express';
import { ApplicationStatus, NotificationType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { computeRepaymentSummary, isRepaymentEligible } from './repaymentSummary';
import { computeRepaymentSchedule } from './repaymentSchedule';
import { notify } from '../notifications/notificationsLib';

export async function addRepayment(req: Request, res: Response) {
  const { applicationId, amount, date, note } = req.body;
  const applicantId = req.auth!.userId;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw notFound('Application not found');
  if (application.applicantId !== applicantId) {
    throw forbidden('You can only add repayments to your own applications');
  }
  if (!isRepaymentEligible(application.status)) {
    throw badRequest('Repayments can only be logged once an application is Disbursed or Repaying');
  }

  const repayment = await prisma.repayment.create({
    data: {
      applicationId,
      amount,
      date: date || new Date(),
      note: note?.trim() || null,
    },
  });

  // Auto-advance the pipeline: first payment moves us to Repaying.
  let updatedApplication = application;
  if (application.status === ApplicationStatus.DISBURSED) {
    updatedApplication = await prisma.application.update({
      where: { id: application.id },
      data: { status: ApplicationStatus.REPAYING },
    });
    await notify(
      application.applicantId,
      NotificationType.APPLICATION_STATUS,
      'Your first repayment was logged — your application is now Repaying.',
    );
  }

  // Fully repaid -> mark Closed.
  const { totalDisbursed, totalRepaid } = await loadTotals(application.id);
  if (totalDisbursed > 0 && totalRepaid >= totalDisbursed && updatedApplication.status !== ApplicationStatus.CLOSED) {
    updatedApplication = await prisma.application.update({
      where: { id: application.id },
      data: { status: ApplicationStatus.CLOSED },
    });
    await notify(
      application.applicantId,
      NotificationType.APPLICATION_STATUS,
      'Congratulations — your loan is fully repaid and the application is now Closed.',
    );
  }

  res.status(201).json({ success: true, data: { repayment, status: updatedApplication.status } });
}

export async function getRepaymentsForApplication(req: Request, res: Response) {
  const { applicationId } = req.params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      repayments: { orderBy: { date: 'desc' } },
      opportunity: { select: { constituencyName: true } },
    },
  });
  if (!application) throw notFound('Application not found');

  const isOwner = application.applicantId === req.auth!.userId;
  const isAdmin = req.auth!.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw forbidden('You do not have access to this application');

  const totals = await loadTotals(application.id);
  res.json({
    success: true,
    data: {
      application: {
        id: application.id,
        status: application.status,
        amountDisbursed: totals.totalDisbursed,
        constituency: application.opportunity.constituencyName,
        disbursedAt: application.disbursedAt,
        repaymentDueDate: application.repaymentDueDate,
      },
      repayments: application.repayments,
      summary: computeRepaymentSummary(totals.totalDisbursed, totals.totalRepaid),
      schedule: computeRepaymentSchedule(
        totals.totalDisbursed,
        totals.totalRepaid,
        application.disbursedAt,
        application.repaymentDueDate,
      ),
    },
  });
}

async function loadTotals(applicationId: string) {
  const totals = await prisma.repayment.aggregate({
    where: { applicationId },
    _sum: { amount: true },
  });
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { amountDisbursed: true },
  });
  const totalDisbursed = application?.amountDisbursed ?? 0;
  const totalRepaid = totals._sum.amount ?? 0;
  return { totalDisbursed, totalRepaid };
}