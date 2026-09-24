import 'dotenv/config';
import { PrismaClient, Role, ApplicationStatus, BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { scoreFeasibility } from '../src/modules/feasibility/feasibilityEngine';

const prisma = new PrismaClient();

interface RepaymentInput {
  amount: number;
  date: string;
  note?: string;
}

interface PipelineApplicant {
  name: string;
  email: string;
  opportunityName: string;
  businessIdea: string;
  targetMarket: string;
  startupCosts: number;
  revenueProjection: number;
  amountRequested: number;
  status: ApplicationStatus;
  amountDisbursed?: number;
  disbursedAt?: string;
  linkedAdvisorEmail?: string;
  repayments?: RepaymentInput[];
}

async function main() {
  console.log('Clearing existing data...');
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.resource.deleteMany();
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
  const [admin, advisor1, advisor2, advisor3] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'FundPath Admin',
        email: 'admin@fundpath.zm',
        passwordHash: await bcrypt.hash('Admin@123', 10),
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mulenga Banda',
        email: 'advisor1@fundpath.zm',
        passwordHash: await bcrypt.hash('Advisor@123', 10),
        role: Role.ADVISOR,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Chileshe Nkhoma',
        email: 'advisor2@fundpath.zm',
        passwordHash: await bcrypt.hash('Advisor@123', 10),
        role: Role.ADVISOR,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Kasonde Mwansa',
        email: 'advisor3@fundpath.zm',
        passwordHash: await bcrypt.hash('Advisor@123', 10),
        role: Role.ADVISOR,
      },
    }),
  ]);

  const applicants = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Thandiwe Phiri',
        email: 'applicant@fundpath.zm',
        passwordHash: await bcrypt.hash('Applicant@123', 10),
        role: Role.APPLICANT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mwamba Tembo',
        email: 'mwamba@fundpath.zm',
        passwordHash: await bcrypt.hash('Applicant@123', 10),
        role: Role.APPLICANT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Natasha Zulu',
        email: 'natasha@fundpath.zm',
        passwordHash: await bcrypt.hash('Applicant@123', 10),
        role: Role.APPLICANT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Joseph Mwale',
        email: 'joseph@fundpath.zm',
        passwordHash: await bcrypt.hash('Applicant@123', 10),
        role: Role.APPLICANT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Grace Sikaneta',
        email: 'grace@fundpath.zm',
        passwordHash: await bcrypt.hash('Applicant@123', 10),
        role: Role.APPLICANT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Peter Chanda',
        email: 'peter@fundpath.zm',
        passwordHash: await bcrypt.hash('Applicant@123', 10),
        role: Role.APPLICANT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Lydia Banda',
        email: 'lydia@fundpath.zm',
        passwordHash: await bcrypt.hash('Applicant@123', 10),
        role: Role.APPLICANT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Chiko Daka',
        email: 'chiko@fundpath.zm',
        passwordHash: await bcrypt.hash('Applicant@123', 10),
        role: Role.APPLICANT,
      },
    }),
  ]);

  console.log('Seeding advisor profiles (two verified, one pending verification)...');
  await Promise.all([
    prisma.advisorProfile.create({
      data: {
        userId: advisor1.id,
        specialty: 'business_plans',
        bio: 'I have helped 40+ small businesses in Lusaka write bank-ready business plans and pitch decks.',
        pricePerSession: 250,
        verified: true,
      },
    }),
    prisma.advisorProfile.create({
      data: {
        userId: advisor2.id,
        specialty: 'feasibility',
        bio: 'Market researcher specialising in feasibility studies and financial modelling for agribusiness ventures.',
        pricePerSession: 300,
        verified: true,
      },
    }),
    prisma.advisorProfile.create({
      data: {
        userId: advisor3.id,
        specialty: 'marketing',
        bio: 'Growth and marketing strategist for market vendors and informal traders looking to formalise.',
        pricePerSession: 200,
        verified: false,
      },
    }),
  ]);

  console.log('Seeding CDF opportunities...');
  const opportunityNames = [
    ['Lusaka Central', 'Agriculture', 150000, '2026-12-31'],
    ['Kitwe Central', 'Trade & Retail', 100000, '2026-11-30'],
    ['Ndola Central', 'Services', 120000, '2027-01-15'],
    ['Kabwe Central', 'Manufacturing', 90000, '2026-12-15'],
    ['Livingstone Central', 'Tourism & Hospitality', 80000, '2027-02-28'],
    ['Mongu Central', 'Agribusiness', 110000, '2027-03-31'],
    ['Chipata Central', 'Agribusiness', 100000, '2027-04-30'],
    ['Choma Central', 'Livestock', 130000, '2027-05-31'],
  ] as const;

  const opportunities: Record<string, { id: string; amountAvailable: number }> = {};
  for (const [name, category, amountAvailable, deadline] of opportunityNames) {
    const opportunity = await prisma.opportunity.create({
      data: { constituencyName: name, category, amountAvailable, deadline: new Date(deadline) },
    });
    opportunities[name] = { id: opportunity.id, amountAvailable };
  }

  console.log('Seeding business plans, scores and applications...');
  const pipeline: PipelineApplicant[] = [
    {
      name: 'Thandiwe Phiri',
      email: 'applicant@fundpath.zm',
      opportunityName: 'Lusaka Central',
      businessIdea:
        'A poultry value-chain farm on the outskirts of Lusaka supplying day-old chicks, feed and hatching services to smallholder farmers across the constituency.',
      targetMarket:
        'Smallholder poultry farmers in Lusaka Central plus urban restaurants seeking reliable egg and broiler supply.',
      startupCosts: 60000,
      revenueProjection: 155000,
      amountRequested: 95000,
      status: ApplicationStatus.DISBURSED,
      amountDisbursed: 95000,
      disbursedAt: '2026-06-01',
      linkedAdvisorEmail: 'advisor1@fundpath.zm',
      repayments: [
        { amount: 20000, date: '2026-08-01', note: 'First quarterly repayment' },
        { amount: 15000, date: '2026-09-01', note: 'Second quarterly repayment' },
      ],
    },
    {
      name: 'Mwamba Tembo',
      email: 'mwamba@fundpath.zm',
      opportunityName: 'Kitwe Central',
      businessIdea:
        'A mobile bakery producing fresh bread, scones and buns for schools and market corners across Kitwe Central, using a solar-assisted oven.',
      targetMarket:
        'Primary schools, mini-markets and neighbourhood kiosks within a 15km radius of Kitwe town centre.',
      startupCosts: 30000,
      revenueProjection: 52000,
      amountRequested: 40000,
      status: ApplicationStatus.APPROVED,
    },
    {
      name: 'Natasha Zulu',
      email: 'natasha@fundpath.zm',
      opportunityName: 'Ndola Central',
      businessIdea:
        'An urban market-garden cooperative growing high-value vegetables year-round under drip irrigation and selling direct to Ndola restaurants.',
      targetMarket:
        'Hotels, lodges and independent restaurants in Ndola plus walk-in customers at a weekend farmers market.',
      startupCosts: 40000,
      revenueProjection: 30000,
      amountRequested: 145000,
      status: ApplicationStatus.REPAYING,
      amountDisbursed: 145000,
      disbursedAt: '2026-05-15',
      linkedAdvisorEmail: 'advisor1@fundpath.zm',
      repayments: [
        { amount: 40000, date: '2026-07-15', note: 'First repayment' },
        { amount: 35000, date: '2026-09-15', note: 'Second repayment' },
      ],
    },
    {
      name: 'Joseph Mwale',
      email: 'joseph@fundpath.zm',
      opportunityName: 'Kabwe Central',
      businessIdea:
        'A small workshop producing traditional chitenge tote bags, woven baskets and recycled-paper crafts for tourists and local boutiques.',
      targetMarket:
        'Boutique retailers in Kabwe and Lusaka, hotel gift shops, and export markets via an online storefront.',
      startupCosts: 45000,
      revenueProjection: 95000,
      amountRequested: 60000,
      status: ApplicationStatus.CLOSED,
      amountDisbursed: 60000,
      disbursedAt: '2026-03-01',
      linkedAdvisorEmail: 'advisor2@fundpath.zm',
      repayments: [
        { amount: 30000, date: '2026-05-01', note: 'First half repaid' },
        { amount: 30000, date: '2026-06-01', note: 'Loan fully repaid' },
      ],
    },
    {
      name: 'Grace Sikaneta',
      email: 'grace@fundpath.zm',
      opportunityName: 'Chipata Central',
      businessIdea:
        'Soya processing and packaging: sourcing beans from local farmers, producing soya chunks, flour and beverages for Chipata wholesalers.',
      targetMarket:
        'Wholesalers and supermarkets across Eastern Province plus school feeding programmes in Chipata district.',
      startupCosts: 50000,
      revenueProjection: 110000,
      amountRequested: 75000,
      status: ApplicationStatus.SUBMITTED,
    },
    {
      name: 'Peter Chanda',
      email: 'peter@fundpath.zm',
      opportunityName: 'Mongu Central',
      businessIdea:
        'A tailoring cooperative making school uniforms and workwear from local chitenge, with a small shopfront in Mongu town.',
      targetMarket:
        'Government and community schools in Mongu requiring annual uniforms, plus local businesses ordering branded workwear.',
      startupCosts: 25000,
      revenueProjection: 15000,
      amountRequested: 150000,
      status: ApplicationStatus.UNDER_REVIEW,
    },
    {
      name: 'Lydia Banda',
      email: 'lydia@fundpath.zm',
      opportunityName: 'Livingstone Central',
      businessIdea:
        'A curio and souvenirs retail stall at Livingstone market selling carved wooden pieces, beads and wire art aimed at tourists on walking tours.',
      targetMarket:
        'Tourists visiting Victoria Falls and Livingstone town, cruise passengers and hotel concierge referrals.',
      startupCosts: 50000,
      revenueProjection: 18000,
      amountRequested: 130000,
      status: ApplicationStatus.REJECTED,
    },
    {
      name: 'Chiko Daka',
      email: 'chiko@fundpath.zm',
      opportunityName: 'Choma Central',
      businessIdea:
        'Free-range poultry and eggs from village chicken raised cage-free, packed and distributed to Choma supermarkets and butcheries.',
      targetMarket:
        'Supermarkets, butcheries and hotels in Choma town plus weekend orders from Lusaka customers via a WhatsApp channel.',
      startupCosts: 70000,
      revenueProjection: 160000,
      amountRequested: 110000,
      status: ApplicationStatus.DISBURSED,
      amountDisbursed: 110000,
      disbursedAt: '2026-08-01',
    },
  ];

  const applicantByEmail = new Map(applicants.map((applicant) => [applicant.email, applicant]));
  const advisorByEmail = new Map([
    ['advisor1@fundpath.zm', advisor1],
    ['advisor2@fundpath.zm', advisor2],
    ['advisor3@fundpath.zm', advisor3],
  ]);

  const addMonths = (date: Date, months: number) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  };

  for (const item of pipeline) {
    const applicant = applicantByEmail.get(item.email);
    if (!applicant) throw new Error(`Missing seeded applicant for ${item.email}`);
    const opportunity = opportunities[item.opportunityName];
    const linkedAdvisor = item.linkedAdvisorEmail ? advisorByEmail.get(item.linkedAdvisorEmail) : undefined;

    const plan = await prisma.businessPlan.create({
      data: {
        applicantId: applicant.id,
        opportunityId: opportunity.id,
        advisorId: linkedAdvisor?.id ?? null,
        businessIdea: item.businessIdea,
        targetMarket: item.targetMarket,
        startupCosts: item.startupCosts,
        revenueProjection: item.revenueProjection,
        amountRequested: item.amountRequested,
      },
    });

    const assessment = scoreFeasibility({
      businessIdea: item.businessIdea,
      targetMarket: item.targetMarket,
      startupCosts: item.startupCosts,
      revenueProjection: item.revenueProjection,
      amountRequested: item.amountRequested,
      amountAvailable: opportunity.amountAvailable,
    });

    await prisma.feasibilityScore.create({
      data: {
        businessPlanId: plan.id,
        score: assessment.score,
        category: assessment.category,
        recommendations: assessment.recommendations,
      },
    });

    const application = await prisma.application.create({
      data: {
        applicantId: applicant.id,
        opportunityId: opportunity.id,
        businessPlanId: plan.id,
        status: item.status,
        amountDisbursed: item.amountDisbursed ?? null,
        disbursedAt: item.disbursedAt ? new Date(item.disbursedAt) : null,
        repaymentDueDate: item.disbursedAt ? addMonths(new Date(item.disbursedAt), 12) : null,
      },
    });

    if (item.repayments?.length) {
      await prisma.repayment.createMany({
        data: item.repayments.map((r) => ({ applicationId: application.id, ...r, date: new Date(r.date) })),
      });
    }
  }

  console.log('Seeding sample storefront products...');
  const storefrontProducts: Record<string, { name: string; description: string; price: number; imageUrl: string }[]> = {
    'applicant@fundpath.zm': [
      {
        name: 'Day-old chicks (bundle of 50)',
        description: 'Healthy, vaccinated day-old broiler chicks delivered within Lusaka. Bundle of 50 birds.',
        price: 1250,
        imageUrl: '/placeholders/poultry.svg',
      },
      {
        name: 'Layer feed - 25kg bag',
        description: 'High-protein layer feed formulated for better egg yield. 25kg bags available for bulk orders.',
        price: 320,
        imageUrl: '/placeholders/feed.svg',
      },
    ],
    'natasha@fundpath.zm': [
      {
        name: 'Fresh vegetables basket (weekly)',
        description: 'Seasonal vegetables harvested daily from our drip-irrigated garden. Delivered every week.',
        price: 150,
        imageUrl: '/placeholders/vegetables.svg',
      },
      {
        name: 'Wild forest honey - 500g',
        description: 'Raw honey harvested from Zambian forest hives. No additives, cold-strained.',
        price: 85,
        imageUrl: '/placeholders/honey.svg',
      },
    ],
    'joseph@fundpath.zm': [
      {
        name: 'Handwoven chitenge tote bags',
        description: 'Durable tote bags woven from recycled chitenge fabric — each one unique and machine washable.',
        price: 220,
        imageUrl: '/placeholders/crafts.svg',
      },
    ],
    'chiko@fundpath.zm': [
      {
        name: 'Free-range eggs (tray of 30)',
        description: 'Village chicken eggs from cage-free hens. Trays available for collection in Choma.',
        price: 60,
        imageUrl: '/placeholders/eggs.svg',
      },
      {
        name: 'Sun-dried beef biltong',
        description: 'Lean beef biltong cured and sun-dried the traditional way. 500g packs.',
        price: 180,
        imageUrl: '/placeholders/livestock.svg',
      },
    ],
  };

  for (const item of pipeline) {
    const products = storefrontProducts[item.email];
    if (!products?.length) continue;
    const applicant = applicantByEmail.get(item.email);
    if (!applicant) continue;
    await prisma.product.createMany({
      data: products.map((p) => ({ applicantId: applicant.id, ...p })),
    });
  }

  console.log('Seeding bookings...');
  const bookingA = await prisma.booking.create({
    data: {
      applicantId: applicantByEmail.get('applicant@fundpath.zm')!.id,
      advisorId: advisor1.id,
      status: BookingStatus.PAID,
      price: 250,
      note: 'Session to review my poultry business plan.',
    },
  });
  await prisma.booking.create({
    data: {
      applicantId: applicantByEmail.get('mwamba@fundpath.zm')!.id,
      advisorId: advisor2.id,
      status: BookingStatus.PENDING,
      price: 300,
      note: 'Feasibility review of my bakery revenue projections.',
    },
  });
  await prisma.booking.create({
    data: {
      applicantId: applicantByEmail.get('natasha@fundpath.zm')!.id,
      advisorId: advisor1.id,
      status: BookingStatus.PENDING,
      price: 250,
      note: 'Structuring repayment of my market-garden loan.',
    },
  });
  const bookingD = await prisma.booking.create({
    data: {
      applicantId: applicantByEmail.get('joseph@fundpath.zm')!.id,
      advisorId: advisor2.id,
      status: BookingStatus.PAID,
      price: 300,
      note: 'Post-repayment review of my crafts workshop.',
    },
  });

  console.log('Seeding reviews...');
  await prisma.review.create({
    data: {
      bookingId: bookingA.id,
      applicantId: applicantByEmail.get('applicant@fundpath.zm')!.id,
      advisorId: advisor1.id,
      rating: 5,
      comment:
        'Mulenga tightened my cost assumptions and helped me restructure the poultry plan. Funding approved two weeks later.',
    },
  });
  await prisma.review.create({
    data: {
      bookingId: bookingD.id,
      applicantId: applicantByEmail.get('joseph@fundpath.zm')!.id,
      advisorId: advisor2.id,
      rating: 4,
      comment: 'Solid financial modelling session. Would have liked more time on the export side of the plan.',
    },
  });

  console.log('Seeding booking chat messages...');
  await prisma.message.createMany({
    data: [
      {
        bookingId: bookingA.id,
        senderId: applicantByEmail.get('applicant@fundpath.zm')!.id,
        content: 'Hi Mulenga, I have uploaded my poultry plan. Could you look at the feed-cost assumptions before our session?',
      },
      {
        bookingId: bookingA.id,
        senderId: advisor1.id,
        content: 'Thanks Thandiwe. I reviewed it — your feed cost per bird looks about 15% low. I will bring a corrected model to the session.',
      },
      {
        bookingId: bookingA.id,
        senderId: applicantByEmail.get('applicant@fundpath.zm')!.id,
        content: 'That would be great, thank you. See you Thursday at 10:00.',
      },
      {
        bookingId: bookingA.id,
        senderId: advisor1.id,
        content: 'Perfect. Bring your latest supplier quotes and we will finalise the numbers.',
      },
    ],
  });

  console.log('Seeding notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: applicantByEmail.get('applicant@fundpath.zm')!.id,
        type: 'APPLICATION_STATUS',
        message: 'Your application for Lusaka Central has been disbursed. Repayment schedule is now available.',
      },
      {
        userId: applicantByEmail.get('applicant@fundpath.zm')!.id,
        type: 'NEW_MESSAGE',
        message: 'Mulenga Banda replied in your chat for the poultry business plan session.',
      },
      {
        userId: applicantByEmail.get('chiko@fundpath.zm')!.id,
        type: 'REPAYMENT_DUE',
        message: 'Your first repayment for Choma Central is now due. Log a repayment to stay on track.',
      },
      {
        userId: advisor1.id,
        type: 'NEW_REVIEW',
        message: 'Thandiwe Phiri left you a 5-star review.',
      },
      {
        userId: advisor1.id,
        type: 'NEW_MESSAGE',
        message: 'You have a new message from Thandiwe Phiri about your upcoming session.',
      },
    ],
  });

  console.log('Seeding resource library...');
  await prisma.resource.createMany({
    data: [
      {
        title: 'How to write a CDF business plan that scores well',
        category: 'Business plans',
        content:
          'A strong CDF business plan answers three questions: what you will sell, who will buy it, and how the money adds up.\n\n1. Be specific about your product or service — "fresh vegetables" beats "farming".\n2. Name your target market and how many customers you realistically expect each week.\n3. List startup costs line by line, then show how projected revenue covers them and repays the loan.\n4. Keep your revenue projection honest — over-optimistic numbers reduce your feasibility score.\n5. Explain how the CDF loan changes your business, not just what you will buy.',
      },
      {
        title: 'Understanding your feasibility score',
        category: 'Feasibility',
        content:
          'Your feasibility score is a 0–100 signal of how ready your plan is for funding. It weighs your requested amount against the opportunity limit, the gap between startup costs and revenue, and how clearly you describe your market.\n\nA higher score means fewer risks for the committee. If your score is low, the recommendations on the plan page tell you exactly what to improve — usually market detail and revenue realism.',
      },
      {
        title: 'Repaying your CDF loan: staying on track',
        category: 'Repayments',
        content:
          'Repayments are spread evenly across 12 months. Your dashboard shows how much you should have repaid by today, based on your disbursement date.\n\nIf the bar turns red you are behind schedule. Log every repayment as soon as you make it, and talk to your advisor early if you expect a slow month. Consistent partial repayments protect your standing better than missed full ones.',
      },
      {
        title: 'Marketing on a small budget',
        category: 'Marketing',
        content:
          'You do not need a big budget to find customers.\n\n• List your products on the FundPath marketplace so funded businesses and buyers can find you.\n• Use WhatsApp status and community groups — post a photo and price daily.\n• Partner with two or three nearby shops to stock your product on commission.\n• Ask every satisfied customer for one referral; word of mouth is free and converts best.',
      },
      {
        title: 'Working with an advisor',
        category: 'Advisors',
        content:
          'Advisors are experienced business people who review your plan and financials. Book a session when you need a second opinion on costs, pricing or growth.\n\nBefore the session, upload your latest numbers and write down your top three questions. After the session, leave a review — it helps other applicants choose the right advisor and holds everyone to a high standard.',
      },
    ],
  });

  console.log('Seed complete.');
  console.log('-----------------------------------');
  console.log('Test accounts (all applicants: Applicant@123, all advisors: Advisor@123):');
  console.log('  Admin:     admin@fundpath.zm / Admin@123');
  console.log('  Advisor 1: advisor1@fundpath.zm (verified)   Advisor 2: advisor2@fundpath.zm (verified)');
  console.log('  Advisor 3: advisor3@fundpath.zm (pending verification)');
  for (const item of pipeline) {
    console.log(`  Applicant:  ${item.email} — ${item.status} (${item.businessIdea.slice(0, 40)}…)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
