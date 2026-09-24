import { NotificationType } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export async function notify(userId: string, type: NotificationType, message: string) {
  return prisma.notification.create({ data: { userId, type, message } });
}