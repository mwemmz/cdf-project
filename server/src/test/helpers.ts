import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import type { Role, User, ApplicationStatus } from '@prisma/client';

// The app is created in-process: no listen(), no port. Supertest drives it
// through the exported factory, which is the seam every test goes through.
export const app = createApp();
export { request };

// Delete children before parents (FK order).
export async function resetDb(): Promise<void> {
  await prisma.repayment.deleteMany();
  await prisma.application.deleteMany();
  await prisma.feasibilityScore.deleteMany();
  await prisma.businessPlan.deleteMany();
  await prisma.product.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.advisorProfile.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.user.deleteMany();
}

let userCounter = 0;

export async function createUser(role: Role, name: string): Promise<{ user: User; token: string }> {
  userCounter += 1;
  const user = await prisma.user.create({
    data: {
      name,
      email: `${role.toLowerCase()}-${userCounter}-${Date.now()}@test.zm`,
      passwordHash: await bcrypt.hash('Passw0rd!', 4),
      role,
    },
  });
  return { user, token: signToken({ userId: user.id, role }) };
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function createOpportunity(data?: {
  constituencyName?: string;
  category?: string;
  amountAvailable?: number;
  deadline?: Date;
}) {
  return prisma.opportunity.create({
    data: {
      constituencyName: data?.constituencyName ?? 'Mandevu',
      category: data?.category ?? 'Agriculture',
      amountAvailable: data?.amountAvailable ?? 50_000,
      deadline: data?.deadline ?? new Date('2030-06-30'),
    },
  });
}

export async function createPlanWithScore(
  applicantId: string,
  opportunityId: string,
  amountRequested = 10_000,
  category = 'High',
) {
  const plan = await prisma.businessPlan.create({
    data: {
      applicantId,
      opportunityId,
      businessIdea: 'Test poultry farm',
      targetMarket: 'Local markets',
      startupCosts: 6_000,
      revenueProjection: 9_000,
      amountRequested,
    },
  });
  const score = await prisma.feasibilityScore.create({
    data: {
      businessPlanId: plan.id,
      score: 72,
      category,
      recommendations: 'Proceed with caution on feed costs',
    },
  });
  return { plan, score };
}

export async function createApplication(
  applicantId: string,
  opportunityId: string,
  planId: string,
  status?: ApplicationStatus,
) {
  return prisma.application.create({
    data: {
      applicantId,
      opportunityId,
      businessPlanId: planId,
      ...(status ? { status } : {}),
    },
    include: { businessPlan: true, opportunity: true, repayments: true },
  });
}
