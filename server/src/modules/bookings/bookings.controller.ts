import { Request, Response } from 'express';
import { BookingStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../utils/errors';

const bookingInclude = {
  applicant: { select: { id: true, name: true, email: true } },
  advisor: {
    select: {
      id: true,
      name: true,
      email: true,
      advisorProfile: true,
    },
  },
};

export async function createBooking(req: Request, res: Response) {
  const applicantId = req.auth!.userId;
  const { advisorId, note } = req.body;

  const advisor = await prisma.user.findUnique({
    where: { id: advisorId },
    include: { advisorProfile: true },
  });
  if (!advisor || advisor.role !== 'ADVISOR') {
    throw badRequest('That advisor does not exist');
  }
  if (!advisor.advisorProfile?.verified) {
    throw badRequest('That advisor is not yet verified');
  }
  if (advisor.id === applicantId) {
    throw badRequest('You cannot book yourself');
  }

  const booking = await prisma.booking.create({
    data: {
      applicantId,
      advisorId: advisor.id,
      price: advisor.advisorProfile.pricePerSession,
      note: note?.trim() || null,
      status: BookingStatus.PENDING,
    },
    include: bookingInclude,
  });

  res.status(201).json({ success: true, data: booking });
}

export async function listMyBookings(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const isAdvisor = req.auth!.role === 'ADVISOR';

  const bookings = await prisma.booking.findMany({
    where: isAdvisor ? { advisorId: userId } : { applicantId: userId },
    include: {
      advisor: { select: { id: true, name: true, email: true, advisorProfile: true } },
      applicant: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: bookings });
}

export async function markBookingPaid(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw notFound('Booking not found');

  const isApplicantOwner = booking.applicantId === userId;
  const isAdvisor = booking.advisorId === userId;
  if (!isApplicantOwner && !isAdvisor) throw forbidden('You do not own this booking');

  if (booking.status === BookingStatus.PAID) {
    throw badRequest('This booking is already marked as paid');
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.PAID },
    include: bookingInclude,
  });

  res.json({ success: true, data: updated });
}