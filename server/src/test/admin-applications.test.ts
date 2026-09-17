import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { ApplicationStatus } from '@prisma/client';
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

describe('admin application queue', () => {
  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('a non-admin token is forbidden', async () => {
    const { token } = await createUser('APPLICANT', 'Applicant A');
    const res = await request(app).get('/api/admin/applications').set(auth(token));
    assert.equal(res.status, 403);
  });

  it('lists applications from every applicant, not just one', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const { user: alice } = await createUser('APPLICANT', 'Alice Banda');
    const { user: chali } = await createUser('APPLICANT', 'Chali Mwansa');
    const opportunity = await createOpportunity();

    const p1 = await createPlanWithScore(alice.id, opportunity.id, 8_000);
    await createApplication(alice.id, opportunity.id, p1.plan.id, ApplicationStatus.SUBMITTED);
    const p2 = await createPlanWithScore(chali.id, opportunity.id, 12_000);
    await createApplication(chali.id, opportunity.id, p2.plan.id, ApplicationStatus.APPROVED);

    const res = await request(app).get('/api/admin/applications').set(auth(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const rows = res.body.data;
    assert.equal(rows.length, 2);
    const applicantNames = rows.map((r: { applicant: { name: string } }) => r.applicant.name);
    assert.ok(applicantNames.includes('Alice Banda'));
    assert.ok(applicantNames.includes('Chali Mwansa'));
    assert.equal(new Set(applicantNames).size, 2, 'must span more than one applicant');

    const first = rows[0];
    assert.equal(first.opportunity.constituencyName, 'Mandevu');
    assert.equal(first.businessPlan.amountRequested, 12_000); // newest first
  });

  it('a stage filter narrows the queue', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const { user: applicant } = await createUser('APPLICANT', 'Applicant A');
    const opportunity = await createOpportunity();

    const p1 = await createPlanWithScore(applicant.id, opportunity.id, 8_000);
    await createApplication(applicant.id, opportunity.id, p1.plan.id, ApplicationStatus.SUBMITTED);
    const p2 = await createPlanWithScore(applicant.id, opportunity.id, 12_000);
    await createApplication(applicant.id, opportunity.id, p2.plan.id, ApplicationStatus.REJECTED);
    const p3 = await createPlanWithScore(applicant.id, opportunity.id, 15_000);
    await createApplication(applicant.id, opportunity.id, p3.plan.id, ApplicationStatus.APPROVED);

    const res = await request(app)
      .get('/api/admin/applications')
      .query({ status: ApplicationStatus.REJECTED })
      .set(auth(token));
    assert.equal(res.status, 200);
    const rows = res.body.data;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, ApplicationStatus.REJECTED);
    assert.equal(rows[0].businessPlan.amountRequested, 12_000);
  });

  it('an unknown stage is rejected', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const res = await request(app)
      .get('/api/admin/applications')
      .query({ status: 'NOT_A_STAGE' })
      .set(auth(token));
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('an empty queue returns an empty list, not an error', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const res = await request(app).get('/api/admin/applications').set(auth(token));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, []);
  });
});
