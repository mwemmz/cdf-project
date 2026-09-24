import { ApplicationStatus, NotificationType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { notify } from '../notifications/notificationsLib';

const DUE_SOON_DAYS = 7;

// Simple on-login / on-dashboard-load check. Not a cron job.
// Creates a REPAYMENT_DUE notification when a due date is within 7 days or overdue,
// unless a matching unread reminder already exists for that application.
export async function ensureRepaymentReminders(userId: string) {
  const now = new Date();
  const dueSoon = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);

  const applications = await prisma.application.findMany({
    where: {
      applicantId: userId,
      status: { in: [ApplicationStatus.DISBURSED, ApplicationStatus.REPAYING] },
      amountDisbursed: { gt: 0 },
    },
    select: {
      id: true,
      repaymentDueDate: true,
      amountDisbursed: true,
      businessPlan: { select: { businessIdea: true } },
    },
  });

  let created = 0;

  for (const app of applications) {
    if (!app.repaymentDueDate) continue;

    const totalRepaid =
      (await prisma.repayment.aggregate({ where: { applicationId: app.id }, _sum: { amount: true } }))._sum.amount ?? 0;
    if (app.amountDisbursed && totalRepaid >= app.amountDisbursed) continue;

    const dueAt = app.repaymentDueDate.getTime();
    const overdue = dueAt < now.getTime();
    const dueWithinSoon = dueAt <= dueSoon.getTime();
    if (!overdue && !dueWithinSoon) continue;

    const existing = await prisma.notification.findFirst({
      where: { userId, type: NotificationType.REPAYMENT_DUE, read: false, message: { contains: app.id } },
      select: { id: true },
    });
    if (existing) continue;

    const dueLabel = app.repaymentDueDate.toISOString().slice(0, 10);
    const ideaLabel = app.businessPlan.businessIdea.length > 60 ? `${app.businessPlan.businessIdea.slice(0, 57)}…` : app.businessPlan.businessIdea;

    if (overdue) {
      await notify(userId, NotificationType.REPAYMENT_DUE, `Repayment overdue on ${ideaLabel} (due ${dueLabel}). Catch up as soon as possible. App ${app.id}`);
    } else {
      await notify(userId, NotificationType.REPAYMENT_DUE, `Repayment due within 7 days on ${ideaLabel} (due ${dueLabel}). App ${app.id}`);
    }
    created += 1;
  }

  return created;
}