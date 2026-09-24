import { Request, Response } from 'express';
import { NotificationType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, conflict, forbidden, notFound } from '../../utils/errors';
import { notify } from '../notifications/notificationsLib';

export async function createReview(req: Request, res: Response) {
  const applicantId = req.auth!.userId;
  const { bookingId, rating, comment } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });
  if (!booking) throw notFound('Booking not found');
  if (booking.applicantId !== applicantId) throw forbidden('You can only review your own bookings');
  if (booking.status !== 'PAID') throw badRequest('You can only review a booking after it is paid');
  if (booking.review) throw conflict('This booking already has a review');

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      applicantId,
      advisorId: booking.advisorId,
      rating,
      comment: comment?.trim() || null,
    },
  });

  await notify(booking.advisorId, NotificationType.NEW_REVIEW, `You received a ${rating}-star review from a client.`);

  res.status(201).json({ success: true, data: review });
}

// Public: any advisor's reviews + average, keyed by the advisor's user id.
export async function listAdvisorReviews(req: Request, res: Response) {
  const { advisorId } = req.params;

  const advisor = await prisma.user.findUnique({ where: { id: advisorId }, select: { id: true, role: true } });
  if (!advisor || advisor.role !== 'ADVISOR') throw notFound('Advisor not found');

  const reviews = await prisma.review.findMany({
    where: { advisorId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const applicantIds = [...new Set(reviews.map((r) => r.applicantId))];
  const applicants = await prisma.user.findMany({
    where: { id: { in: applicantIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(applicants.map((a) => [a.id, a.name]));

  const aggregate = await prisma.review.aggregate({
    where: { advisorId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  res.json({
    success: true,
    data: {
      average: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
      count: aggregate._count.rating,
      reviews: reviews.map((r) => ({ ...r, applicantName: nameById.get(r.applicantId) ?? 'Applicant' })),
    },
  });
}