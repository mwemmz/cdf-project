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

describe('admin application review actions', () => {
  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('an illegal transition is rejected', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const { user: applicant } = await createUser('APPLICANT', 'Applicant A');
    const opportunity = await createOpportunity();
    const { plan } = await createPlanWithScore(applicant.id, opportunity.id);
    const application = await createApplication(
      applicant.id,
      opportunity.id,
      plan.id,
      ApplicationStatus.SUBMITTED,
    );

    // SUBMITTED can only go to UNDER_REVIEW — skipping straight to APPROVED is illegal.
    const res = await request(app)
      .patch(`/api/applications/${application.id}/status`)
      .set(auth(token))
      .send({ status: ApplicationStatus.APPROVED });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);

    const stored = await prisma.application.findUnique({ where: { id: application.id } });
    assert.equal(stored?.status, ApplicationStatus.SUBMITTED, 'illegal transition must not persist');
  });

  it('a non-positive disbursement amount is rejected', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const { user: applicant } = await createUser('APPLICANT', 'Applicant B');
    const opportunity = await createOpportunity();
    const { plan } = await createPlanWithScore(applicant.id, opportunity.id);
    const application = await createApplication(
      applicant.id,
      opportunity.id,
      plan.id,
      ApplicationStatus.APPROVED,
    );

    for (const amount of [0, -1_000]) {
      const res = await request(app)
        .patch(`/api/applications/${application.id}/status`)
        .set(auth(token))
        .send({ status: ApplicationStatus.DISBURSED, amountDisbursed: amount });
      assert.equal(res.status, 400, `amountDisbursed ${amount} must be rejected`);
    }

    const stored = await prisma.application.findUnique({ where: { id: application.id } });
    assert.equal(stored?.status, ApplicationStatus.APPROVED, 'rejected disbursement must not persist');
    assert.equal(stored?.amountDisbursed, null);
  });

  it('a legal transition persists, recording the disbursement amount', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const { user: applicant } = await createUser('APPLICANT', 'Applicant C');
    const opportunity = await createOpportunity();
    const { plan } = await createPlanWithScore(applicant.id, opportunity.id, 9_000);
    const application = await createApplication(
      applicant.id,
      opportunity.id,
      plan.id,
      ApplicationStatus.UNDER_REVIEW,
    );

    const approve = await request(app)
      .patch(`/api/applications/${application.id}/status`)
      .set(auth(token))
      .send({ status: ApplicationStatus.APPROVED });
    assert.equal(approve.status, 200);
    assert.equal(approve.body.data.status, ApplicationStatus.APPROVED);

    const disburse = await request(app)
      .patch(`/api/applications/${application.id}/status`)
      .set(auth(token))
      .send({ status: ApplicationStatus.DISBURSED, amountDisbursed: 7_500 });
    assert.equal(disburse.status, 200);
    assert.equal(disburse.body.data.amountDisbursed, 7_500);

    const stored = await prisma.application.findUnique({ where: { id: application.id } });
    assert.equal(stored?.status, ApplicationStatus.DISBURSED);
    assert.equal(stored?.amountDisbursed, 7_500);
  });

  it('the admin can read any applicant\'s application detail (plan, score, repayments)', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const { user: applicant } = await createUser('APPLICANT', 'Applicant D');
    const opportunity = await createOpportunity();
    const { plan, score } = await createPlanWithScore(applicant.id, opportunity.id, 4_000);
    const application = await createApplication(applicant.id, opportunity.id, plan.id);

    const res = await request(app).get(`/api/applications/${application.id}`).set(auth(token));
    assert.equal(res.status, 200);
    const data = res.body.data;
    assert.equal(data.businessPlan.businessIdea, 'Test poultry farm');
    assert.equal(data.businessPlan.feasibilityScore.score, score.score);
    assert.equal(data.businessPlan.feasibilityScore.recommendations, score.recommendations);
    assert.equal(data.opportunity.constituencyName, 'Mandevu');
    assert.deepEqual(data.repayments, []);
    assert.deepEqual(data.allowedTransitions, [ApplicationStatus.UNDER_REVIEW]);
  });
});
