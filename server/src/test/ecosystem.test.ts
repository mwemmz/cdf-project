import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { prisma } from '../lib/prisma';
import {
  app,
  request,
  resetDb,
  createUser,
  auth,
  createOpportunity,
  createPlanWithScore,
  createApplication,
} from './helpers';

async function createBooking(applicantId: string, advisorId: string, status: 'PENDING' | 'PAID') {
  return prisma.booking.create({
    data: { applicantId, advisorId, status, price: 200, note: 'Test booking' },
  });
}

async function createFundedApplication(repaying: boolean, disbursed: number, repaid: number, status?: 'REPAYING' | 'APPROVED') {
  const { user: applicant } = await createUser('APPLICANT', `App ${Date.now()}-${Math.random()}`);
  const opportunity = await createOpportunity();
  const { plan } = await createPlanWithScore(applicant.id, opportunity.id);
  const application = await createApplication(applicant.id, opportunity.id, plan.id, status ?? (repaying ? 'REPAYING' : 'APPROVED'));
  await prisma.application.update({ where: { id: application.id }, data: { amountDisbursed: disbursed } });
  if (repaid > 0) {
    await prisma.repayment.create({ data: { applicationId: application.id, amount: repaid, date: new Date() } });
  }
  return { applicant, application };
}

describe('ecosystem: messages, notifications, reviews, showcase, resources', () => {
  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('chat is locked until a booking is paid', async () => {
    const { user: applicant, token } = await createUser('APPLICANT', 'Chat Applicant');
    const { user: advisor } = await createUser('ADVISOR', 'Chat Advisor');
    const pending = await createBooking(applicant.id, advisor.id, 'PENDING');

    const locked = await request(app).get(`/api/messages/${pending.id}`).set(auth(token));
    assert.equal(locked.status, 400);

    await prisma.booking.update({ where: { id: pending.id }, data: { status: 'PAID' } });
    const open = await request(app).get(`/api/messages/${pending.id}`).set(auth(token));
    assert.equal(open.status, 200);
  });

  it('only booking participants can read or send messages, and sending notifies the recipient', async () => {
    const { user: applicant, token: applicantToken } = await createUser('APPLICANT', 'Chat Applicant');
    const { user: advisor, token: advisorToken } = await createUser('ADVISOR', 'Chat Advisor');
    const { user: outsider, token: outsiderToken } = await createUser('APPLICANT', 'Nosy Outsider');
    const booking = await createBooking(applicant.id, advisor.id, 'PAID');

    const denied = await request(app).get(`/api/messages/${booking.id}`).set(auth(outsiderToken));
    assert.equal(denied.status, 403);

    const sent = await request(app)
      .post(`/api/messages/${booking.id}`)
      .set(auth(applicantToken))
      .send({ content: 'Hello, ready for our session?' });
    assert.equal(sent.status, 201);
    assert.equal(sent.body.data.content, 'Hello, ready for our session?');

    const reply = await request(app)
      .post(`/api/messages/${booking.id}`)
      .set(auth(advisorToken))
      .send({ content: 'Yes, send over your numbers.' });
    assert.equal(reply.status, 201);

    const thread = await request(app).get(`/api/messages/${booking.id}`).set(auth(advisorToken));
    assert.equal(thread.body.data.length, 2);

    const advisorNotifications = await prisma.notification.findMany({ where: { userId: advisor.id } });
    assert.equal(advisorNotifications.length, 1);
    assert.equal(advisorNotifications[0].type, 'NEW_MESSAGE');

    const empty = await request(app).post(`/api/messages/${booking.id}`).set(auth(applicantToken)).send({ content: '   ' });
    assert.equal(empty.status, 400);
  });

  it('reviews are gated on a paid booking, limited to one per booking, and update the advisor average', async () => {
    const { user: applicant, token: applicantToken } = await createUser('APPLICANT', 'Review Applicant');
    const { user: advisor, token: advisorToken } = await createUser('ADVISOR', 'Review Advisor');
    const pending = await createBooking(applicant.id, advisor.id, 'PENDING');

    const tooEarly = await request(app)
      .post('/api/reviews')
      .set(auth(applicantToken))
      .send({ bookingId: pending.id, rating: 5 });
    assert.equal(tooEarly.status, 400);

    await prisma.booking.update({ where: { id: pending.id }, data: { status: 'PAID' } });
    const created = await request(app)
      .post('/api/reviews')
      .set(auth(applicantToken))
      .send({ bookingId: pending.id, rating: 5, comment: 'Excellent session' });
    assert.equal(created.status, 201);

    const duplicate = await request(app)
      .post('/api/reviews')
      .set(auth(applicantToken))
      .send({ bookingId: pending.id, rating: 4 });
    assert.equal(duplicate.status, 409);

    const outOfRange = await request(app)
      .post('/api/reviews')
      .set(auth(advisorToken))
      .send({ bookingId: pending.id, rating: 9 });
    assert.equal(outOfRange.status, 403);

    const publicList = await request(app).get(`/api/reviews/advisor/${advisor.id}`);
    assert.equal(publicList.status, 200);
    assert.equal(publicList.body.data.average, 5);
    assert.equal(publicList.body.data.count, 1);
    assert.equal(publicList.body.data.reviews[0].applicantName, 'Review Applicant');

    const advisorNotifications = await prisma.notification.findMany({ where: { userId: advisor.id } });
    assert.ok(advisorNotifications.some((n) => n.type === 'NEW_REVIEW'));
  });

  it('notification unread counts and read toggles are scoped to the owner', async () => {
    const { user: applicant, token } = await createUser('APPLICANT', 'Notify Applicant');
    const { user: other, token: otherToken } = await createUser('APPLICANT', 'Notify Other');

    await prisma.notification.createMany({
      data: [
        { userId: applicant.id, type: 'APPLICATION_STATUS', message: 'Status changed' },
        { userId: applicant.id, type: 'NEW_MESSAGE', message: 'New message' },
        { userId: other.id, type: 'NEW_MESSAGE', message: 'Not yours' },
      ],
    });

    const count = await request(app).get('/api/notifications/unread-count').set(auth(token));
    assert.equal(count.body.data.count, 2);

    const all = await request(app).get('/api/notifications').set(auth(token));
    assert.equal(all.body.data.length, 2);

    const first = all.body.data[0];
    const read = await request(app).post(`/api/notifications/${first.id}/read`).set(auth(token));
    assert.equal(read.status, 200);
    assert.equal(read.body.data.read, true);

    const foreign = await request(app).post(`/api/notifications/${first.id}/read`).set(auth(otherToken));
    assert.equal(foreign.status, 403);

    const readAll = await request(app).post('/api/notifications/read-all').set(auth(token));
    assert.equal(readAll.body.data.updatedCount, 1);

    const after = await request(app).get('/api/notifications/unread-count').set(auth(token));
    assert.equal(after.body.data.count, 0);
  });

  it('success stories only include funded businesses that are at least half repaid', async () => {
    await createFundedApplication(true, 1000, 600);
    await createFundedApplication(true, 1000, 400);
    await createFundedApplication(false, 0, 0, 'APPROVED');

    const res = await request(app).get('/api/showcase');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].repaymentPercentage, 60);
    assert.ok(res.body.data[0].blurb.length > 0);
  });

  it('resources can be listed, filtered by category, and fetched by id', async () => {
    await prisma.resource.createMany({
      data: [
        { title: 'Plan guide', category: 'Business plans', content: 'Write a clear plan.' },
        { title: 'Marketing tips', category: 'Marketing', content: 'Post daily.' },
        { title: 'Repay well', category: 'Repayments', content: 'Pay on time.' },
      ],
    });

    const all = await request(app).get('/api/resources');
    assert.equal(all.status, 200);
    assert.equal(all.body.data.length, 3);

    const filtered = await request(app).get('/api/resources?category=Marketing');
    assert.equal(filtered.body.data.length, 1);
    assert.equal(filtered.body.data[0].title, 'Marketing tips');

    const one = await request(app).get(`/api/resources/${all.body.data[0].id}`);
    assert.equal(one.status, 200);

    const missing = await request(app).get('/api/resources/does-not-exist');
    assert.equal(missing.status, 404);
  });
});
