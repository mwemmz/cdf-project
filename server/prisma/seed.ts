import { PrismaClient, Role, ApplicationStatus, BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { scoreFeasibility } from '../src/modules/feasibility/feasibilityEngine';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.product.deleteMany();
  await prisma.repayment.deleteMany();
  await prisma.application.deleteMany();
  await prisma.feasibilityScore.deleteMany();
  await prisma.businessPlan.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.advisorProfile.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const admin = await prisma.user.create({
    data: {
      name: 'FundPath Admin',
      email: 'admin@fundpath.zm',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      role: Role.ADMIN,
    },
  });

  const advisor1 = await prisma.user.create({
    data: {
      name: 'Mulenga Banda',
      email: 'advisor1@fundpath.zm',
      passwordHash: await bcrypt.hash('Advisor@123', 10),
      role: Role.ADVISOR,
    },
  });

  const advisor2 = await prisma.user.create({
    data: {
      name: 'Chileshe Nkhoma',
      email: 'advisor2@fundpath.zm',
      passwordHash: await bcrypt.hash('Advisor@123', 10),
      role: Role.ADVISOR,
    },
  });

  const applicant = await prisma.user.create({
    data: {
      name: 'Thandiwe Phiri',
      email: 'applicant@fundpath.zm',
      passwordHash: await bcrypt.hash('Applicant@123', 10),
      role: Role.APPLICANT,
    },
  });

  console.log('Seeding advisor profiles (verified for testing)...');
  await prisma.advisorProfile.create({
    data: {
      userId: advisor1.id,
      specialty: 'business_plans',
      bio: 'I have helped 40+ small businesses in Lusaka write bank-ready business plans and pitch decks.',
      pricePerSession: 250,
      verified: true,
    },
  });
  await prisma.advisorProfile.create({
    data: {
      userId: advisor2.id,
      specialty: 'feasibility',
      bio: 'Market researcher specialising in feasibility studies and financial modelling for agribusiness ventures.',
      pricePerSession: 300,
      verified: true,
    },
  });

  console.log('Seeding CDF opportunities...');
  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        constituencyName: 'Lusaka Central',
        category: 'Agriculture',
        amountAvailable: 150000,
        deadline: new Date('2026-12-31'),
      },
    }),
    prisma.opportunity.create({
      data: {
        constituencyName: 'Kitwe Central',
        category: 'Trade & Retail',
        amountAvailable: 100000,
        deadline: new Date('2026-11-30'),
      },
    }),
    prisma.opportunity.create({
      data: {
        constituencyName: 'Ndola Central',
        category: 'Services',
        amountAvailable: 120000,
        deadline: new Date('2027-01-15'),
      },
    }),
    prisma.opportunity.create({
      data: {
        constituencyName: 'Kabwe Central',
        category: 'Manufacturing',
        amountAvailable: 90000,
        deadline: new Date('2026-12-15'),
      },
    }),
    prisma.opportunity.create({
      data: {
        constituencyName: 'Livingstone Central',
        category: 'Tourism & Hospitality',
        amountAvailable: 80000,
        deadline: new Date('2027-02-28'),
      },
    }),
    prisma.opportunity.create({
      data: {
        constituencyName: 'Mongu Central',
        category: 'Agribusiness',
        amountAvailable: 110000,
        deadline: new Date('2027-03-31'),
      },
    }),
  ]);

  console.log('Seeding demo application data...');
  const demoOpportunity = opportunities[0];
  const demoPlan = await prisma.businessPlan.create({
    data: {
      applicantId: applicant.id,
      opportunityId: demoOpportunity.id,
      businessIdea:
        'A poultry value-chain farm on the outskirts of Lusaka supplying day-old chicks, feed and hatching services to smallholder farmers across the constituency.',
      targetMarket:
        'Smallholder poultry farmers in Lusaka Central plus urban restaurants seeking reliable egg and broiler supply.',
      startupCosts: 60000,
      revenueProjection: 155000,
      amountRequested: 95000,
    },
  });

  const assessment = scoreFeasibility({
    businessIdea: demoPlan.businessIdea,
    targetMarket: demoPlan.targetMarket,
    startupCosts: demoPlan.startupCosts,
    revenueProjection: demoPlan.revenueProjection,
    amountRequested: demoPlan.amountRequested,
    amountAvailable: demoOpportunity.amountAvailable,
  });

  await prisma.feasibilityScore.create({
    data: {
      businessPlanId: demoPlan.id,
      score: assessment.score,
      category: assessment.category,
      recommendations: assessment.recommendations,
    },
  });

  const demoApplication = await prisma.application.create({
    data: {
      applicantId: applicant.id,
      opportunityId: demoOpportunity.id,
      businessPlanId: demoPlan.id,
      status: ApplicationStatus.DISBURSED,
      amountDisbursed: 95000,
    },
  });

  await prisma.repayment.createMany({
    data: [
      {
        applicationId: demoApplication.id,
        amount: 20000,
        date: new Date('2026-08-01'),
        note: 'First quarterly repayment',
      },
      {
        applicationId: demoApplication.id,
        amount: 15000,
        date: new Date('2026-09-01'),
        note: 'Second quarterly repayment',
      },
    ],
  });

  console.log('Seeding sample storefront products...');
  await prisma.product.createMany({
    data: [
      {
        applicantId: applicant.id,
        name: 'Day-old chicks (bundle of 50)',
        description:
          'Healthy, vaccinated day-old broiler chicks delivered within Lusaka. Bundle of 50 birds.',
        price: 1250,
        imageUrl: 'https://via.placeholder.com/400x300?text=Poultry',
      },
      {
        applicantId: applicant.id,
        name: 'Layer feed - 25kg bag',
        description:
          'High-protein layer feed formulated for better egg yield. 25kg bags available for bulk orders.',
        price: 320,
        imageUrl: 'https://via.placeholder.com/400x300?text=Feed',
      },
    ],
  });

  console.log('Seeding a booking (paid) for the demo applicant...');
  await prisma.booking.create({
    data: {
      applicantId: applicant.id,
      advisorId: advisor1.id,
      status: BookingStatus.PAID,
      price: 250,
      note: 'Session to review my poultry business plan.',
    },
  });

  console.log('Seed complete.');
  console.log('-----------------------------------');
  console.log('Test accounts:');
  console.log('  Admin:     admin@fundpath.zm / Admin@123');
  console.log('  Advisor 1: advisor1@fundpath.zm / Advisor@123');
  console.log('  Advisor 2: advisor2@fundpath.zm / Advisor@123');
  console.log('  Applicant: applicant@fundpath.zm / Applicant@123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });