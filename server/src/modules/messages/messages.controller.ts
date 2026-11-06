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

// Inbox: every PAID booking the user is part of, with the latest message.
export async function listConversations(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const bookings = await prisma.booking.findMany({
    where: { status: 'PAID', OR: [{ applicantId: userId }, { advisorId: userId }] },
    include: {
      applicant: { select: { id: true, name: true } },
      advisor: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, include: messageInclude },
    },
  });
  const rows = bookings
    .map((b) => {
      const last = b.messages[0] ?? null;
      return {
        kind: 'booking' as const,
        bookingId: b.id,
        other: b.applicantId === userId ? b.advisor : b.applicant,
        lastMessage: last ? { content: last.content, senderId: last.senderId, createdAt: last.createdAt } : null,
        updatedAt: last ? last.createdAt : b.createdAt,
      };
    })
    ;

  const threads = await prisma.productThread.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    include: {
      product: { select: { id: true, name: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, include: messageInclude },
    },
  });
  const threadRows = threads.map((t) => {
    const last = t.messages[0] ?? null;
    return {
      kind: 'product' as const,
      threadId: t.id,
      productName: t.product.name,
      other: t.buyerId === userId ? t.seller : t.buyer,
      lastMessage: last ? { content: last.content, senderId: last.senderId, createdAt: last.createdAt } : null,
      updatedAt: last ? last.createdAt : t.createdAt,
    };
  });

  const all = [...rows, ...threadRows].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  res.json({ success: true, data: all });
}


// ---------------------------------------------------------------------------
// Marketplace chat: buyer <-> seller about one product
// ---------------------------------------------------------------------------

async function loadThread(threadId: string, userId: string) {
  const thread = await prisma.productThread.findUnique({ where: { id: threadId } });
  if (!thread) throw notFound('Conversation not found');
  if (thread.buyerId !== userId && thread.sellerId !== userId) {
    throw forbidden('You are not a participant in this conversation');
  }
  return thread;
}

// Open (or reuse) the conversation between the signed-in buyer and a product's seller.
export async function openProductThread(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
  if (!product) throw notFound('Product not found');
  if (product.applicantId === userId) throw badRequest('This is your own product');
  const thread = await prisma.productThread.upsert({
    where: { productId_buyerId: { productId: product.id, buyerId: userId } },
    update: {},
    create: { productId: product.id, buyerId: userId, sellerId: product.applicantId },
  });
  res.status(201).json({ success: true, data: { threadId: thread.id } });
}

export async function listThreadMessages(req: Request, res: Response) {
  const thread = await loadThread(req.params.threadId, req.auth!.userId);
  const messages = await prisma.productMessage.findMany({
    where: { threadId: thread.id },
    include: messageInclude,
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: messages });
}

export async function sendThreadMessage(req: Request, res: Response) {
  const thread = await loadThread(req.params.threadId, req.auth!.userId);
  const message = await prisma.productMessage.create({
    data: { threadId: thread.id, senderId: req.auth!.userId, content: req.body.content.trim() },
    include: messageInclude,
  });
  const recipientId = thread.buyerId === req.auth!.userId ? thread.sellerId : thread.buyerId;
  await notify(recipientId, NotificationType.NEW_MESSAGE, 'You have a new message about a marketplace product.');
  res.status(201).json({ success: true, data: message });
}
