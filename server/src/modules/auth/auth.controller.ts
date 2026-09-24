import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../lib/jwt';
import { badRequest, conflict, unauthorized } from '../../utils/errors';
import { ensureRepaymentReminders } from '../repayments/repaymentReminder';

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('An account with that email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({
    success: true,
    data: { token, user: serializeUser(user) },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw unauthorized('Invalid email or password');

  // On-login check: surface any repayments due within 7 days / overdue.
  await ensureRepaymentReminders(user.id).catch(() => undefined);

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    success: true,
    data: { token, user: serializeUser(user) },
  });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    include: {
      advisorProfile: true,
      _count: { select: { businessPlans: true, applications: true, products: true } },
    },
  });
  if (!user) throw badRequest('User not found');
  res.json({ success: true, data: user });
}