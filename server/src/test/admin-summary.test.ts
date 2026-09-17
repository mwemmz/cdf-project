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

async function addRepayment(applicationId: string, amount: number) {
  return prisma.repayment.create({ data: { applicationId, amount, date: new Date() } });
}

describe('admin summary endpoint', () => {
  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('an empty platform reports zero everywhere', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const res = await request(app).get('/api/admin/summary').set(auth(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const data = res.body.data;
    assert.equal(data.applications.total, 0);
    for (const stage of Object.values(ApplicationStatus)) {
      assert.equal(data.applications.byStage[stage], 0, `byStage.${stage}`);
    }
    assert.equal(data.money.requested, 0);
    assert.equal(data.money.disbursed, 0);
    assert.equal(data.money.repaid, 0);
    assert.equal(data.money.outstanding, 0);
    assert.equal(data.advisorsAwaitingVerification, 0);
    assert.equal(data.opportunities, 0);
  });

  it('aggregates are computed from stored data, not guessed', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const { user: applicant } = await createUser('APPLICANT', 'Applicant A');
    const opportunity = await createOpportunity();

    const a1 = await createPlanWithScore(applicant.id, opportunity.id, 10_000);
    const app1 = await createApplication(applicant.id, opportunity.id, a1.plan.id);
    await addRepayment(app1.id, 2_000);
    await prisma.application.update({
      where: { id: app1.id },
      data: { status: ApplicationStatus.REPAYING, amountDisbursed: 10_000 },
    });

    const a2 = await createPlanWithScore(applicant.id, opportunity.id, 25_000);
    await createApplication(applicant.id, opportunity.id, a2.plan.id, ApplicationStatus.SUBMITTED);

    const a3 = await createPlanWithScore(applicant.id, opportunity.id, 15_000);
    const app3 = await createApplication(applicant.id, opportunity.id, a3.plan.id, ApplicationStatus.REJECTED);

    const res = await request(app).get('/api/admin/summary').set(auth(token));
    const data = res.body.data;

    assert.equal(data.applications.total, 3);
    assert.equal(data.applications.byStage.REPAYING, 1);
    assert.equal(data.applications.byStage.SUBMITTED, 1);
    assert.equal(data.applications.byStage.REJECTED, 1);
    assert.equal(data.applications.byStage.UNDER_REVIEW, 0);

    assert.equal(data.money.requested, 50_000); // 10k + 25k + 15k
    assert.equal(data.money.disbursed, 10_000);
    assert.equal(data.money.repaid, 2_000);
    assert.equal(data.money.outstanding, 8_000); // 10k disbursed - 2k repaid

    await createOpportunity(); // second opportunity
    const res2 = await request(app).get('/api/admin/summary').set(auth(token));
    assert.equal(res2.body.data.opportunities, 2);
    assert.equal(res2.body.data.advisorsAwaitingVerification, 0);
  });

  it('amounts never go below zero, even with over-repayment', async () => flooredAmountTest());

  async function flooredAmountTest() {
    const { token } = await createUser('ADMIN', 'Admin A');
    const { user: applicant } = await createUser('APPLICANT', 'Applicant F');
    const opportunity = await createOpportunity();
    const { plan } = await createPlanWithScore(applicant.id, opportunity.id, 5_000);
    const application = await createApplication(
      applicant.id,
      opportunity.id,
      plan.id,
      ApplicationStatus.REPAYING,
    );
    await prisma.application.update({ where: { id: application.id }, data: { amountDisbursed: 5_000 } });
    await addRepayment(application.id, 7_000); // over-repays by 2_000

    const res = await request(app).get('/api/admin/summary').set(auth(token));
    const data = res.body.data;
    assert.equal(data.money.repaid, 7_000);
    assert.equal(data.money.outstanding, 0); // floored, never -2_000
    assert.equal(data.money.disbursed, 5_000);
  }
});
