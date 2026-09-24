import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { forbidden, notFound } from '../../utils/errors';
import { ensureRepaymentReminders } from '../repayments/repaymentReminder';

export async function listMyNotifications(req: Request, res: Response) {
  const userId = req.auth!.userId;
  await ensureRepaymentReminders(userId);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: notifications });
}

export async function getUnreadCount(req: Request, res: Response) {
  const userId = req.auth!.userId;
  await ensureRepaymentReminders(userId);

  const count = await prisma.notification.count({ where: { userId, read: false } });
  res.json({ success: true, data: { count } });
}

export async function markOneRead(req: Request, res: Response) {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification) throw notFound('Notification not found');
  if (notification.userId !== req.auth!.userId) throw forbidden('Not your notification');

  const updated = await prisma.notification.update({ where: { id: notification.id }, data: { read: true } });
  res.json({ success: true, data: updated });
}

export async function markAllRead(req: Request, res: Response) {
  const result = await prisma.notification.updateMany({
    where: { userId: req.auth!.userId, read: false },
    data: { read: true },
  });
  res.json({ success: true, data: { updatedCount: result.count } });
}