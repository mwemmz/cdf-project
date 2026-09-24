import { Request, Response } from 'express';
import { NotificationType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { notify } from '../notifications/notificationsLib';

const messageInclude = {
  sender: { select: { id: true, name: true } },
} as const;

async function loadChatBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw notFound('Booking not found');
  if (booking.applicantId !== userId && booking.advisorId !== userId) {
    throw forbidden('You are not a participant in this booking');
  }
  if (booking.status !== 'PAID') {
    throw badRequest('Chat unlocks once this booking is marked as paid');
  }
  return booking;
}

export async function listMessages(req: Request, res: Response) {
  const booking = await loadChatBooking(req.params.bookingId, req.auth!.userId);
  const messages = await prisma.message.findMany({
    where: { bookingId: booking.id },
    include: messageInclude,
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: messages });
}

export async function sendMessage(req: Request, res: Response) {
  const booking = await loadChatBooking(req.params.bookingId, req.auth!.userId);
  const { content } = req.body;

  const message = await prisma.message.create({
    data: {
      bookingId: booking.id,
      senderId: req.auth!.userId,
      content: content.trim(),
    },
    include: messageInclude,
  });

  const recipientId = booking.applicantId === req.auth!.userId ? booking.advisorId : booking.applicantId;
  await notify(recipientId, NotificationType.NEW_MESSAGE, 'You have a new message in an advisor booking chat.');

  res.status(201).json({ success: true, data: message });
}