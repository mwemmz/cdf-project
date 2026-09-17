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

describe('test seam: authorization matrix on the admin-gated status endpoint', () => {
  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('GET /health is open (seam sanity check)', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ok');
  });

  it('a request with no token is refused as unauthenticated', async () => {
    const { user: applicant } = await createUser('APPLICANT', 'Applicant A');
    const opportunity = await createOpportunity();
    const { plan } = await createPlanWithScore(applicant.id, opportunity.id);
    const application = await createApplication(applicant.id, opportunity.id, plan.id);

    const res = await request(app).patch(`/api/applications/${application.id}/status`).send({
      status: 'UNDER_REVIEW',
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('an applicant token is refused as forbidden', async () => {
    const { user: applicant } = await createUser('APPLICANT', 'Applicant B');
    const { token: applicantToken } = await createUser('APPLICANT', 'Applicant C');
    const opportunity = await createOpportunity();
    const { plan } = await createPlanWithScore(applicant.id, opportunity.id);
    const application = await createApplication(applicant.id, opportunity.id, plan.id);

    const res = await request(app)
      .patch(`/api/applications/${application.id}/status`)
      .set(auth(applicantToken))
      .send({ status: 'UNDER_REVIEW' });
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('an advisor token is refused as forbidden', async () => {
    const { user: applicant } = await createUser('APPLICANT', 'Applicant D');
    const { token: advisorToken } = await createUser('ADVISOR', 'Advisor A');
    const opportunity = await createOpportunity();
    const { plan } = await createPlanWithScore(applicant.id, opportunity.id);
    const application = await createApplication(applicant.id, opportunity.id, plan.id);

    const res = await request(app)
      .patch(`/api/applications/${application.id}/status`)
      .set(auth(advisorToken))
      .send({ status: 'UNDER_REVIEW' });
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('an admin token reaches the handler and a legal transition persists', async () => {
    const { user: applicant } = await createUser('APPLICANT', 'Applicant E');
    const { token: adminToken } = await createUser('ADMIN', 'Admin A');
    const opportunity = await createOpportunity();
    const { plan } = await createPlanWithScore(applicant.id, opportunity.id);
    const application = await createApplication(applicant.id, opportunity.id, plan.id);

    const res = await request(app)
      .patch(`/api/applications/${application.id}/status`)
      .set(auth(adminToken))
      .send({ status: 'UNDER_REVIEW' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, ApplicationStatus.UNDER_REVIEW);

    const stored = await prisma.application.findUnique({ where: { id: application.id } });
    assert.equal(stored?.status, ApplicationStatus.UNDER_REVIEW);
  });
});
