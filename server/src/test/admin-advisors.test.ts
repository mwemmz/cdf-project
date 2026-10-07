import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { prisma } from '../lib/prisma';
import { app, request, resetDb, createUser, auth } from './helpers';

describe('admin advisor verification queue', () => {
  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  async function createAdvisorWithProfile(name: string, verified: boolean) {
    const { user, token } = await createUser('ADVISOR', name);
    const profile = await prisma.advisorProfile.create({
      data: {
        userId: user.id,
        specialty: 'Business planning',
        bio: `Bio for ${name}`,
        pricePerSession: 150,
        verified,
      },
    });
    return { user, token, profile };
  }

  it('the admin sees every advisor including unverified ones, pending first (the invisibility fix)', async () => {
    const { profile: verifiedProfile } = await createAdvisorWithProfile('Verified Vera', true);
    const { profile: pendingProfile } = await createAdvisorWithProfile('Pending Pat', false);

    // The bug this ticket fixes: the public marketplace hides unverified advisors.
    const publicList = await request(app).get('/api/advisors');
    assert.equal(publicList.status, 200);
    assert.ok(!publicList.body.data.some((a: { id: string }) => a.id === pendingProfile.id));

    const adminList = await request(app)
      .get('/api/admin/advisors')
      .set(auth((await createUser('ADMIN', 'Admin A')).token));
    assert.equal(adminList.status, 200);
    const ids = (adminList.body.data as Array<{ id: string; verified: boolean }>).map((a) => a.id);
    assert.ok(ids.includes(verifiedProfile.id));
    assert.ok(ids.includes(pendingProfile.id), 'unverified advisor must be visible to the admin');
    assert.equal(ids.indexOf(pendingProfile.id) < ids.indexOf(verifiedProfile.id), true, 'pending advisors come first');
  });

  it('allows filtering advisors by verification state and rejects invalid filter values', async () => {
    const { token: adminToken } = await createUser('ADMIN', 'Admin A');
    const { profile: verifiedProfile } = await createAdvisorWithProfile('Verified Vera', true);
    const { profile: pendingProfile } = await createAdvisorWithProfile('Pending Pat', false);

    const pendingOnly = await request(app).get('/api/admin/advisors?verified=false').set(auth(adminToken));
    assert.equal(pendingOnly.status, 200);
    assert.deepEqual(
      (pendingOnly.body.data as Array<{ id: string }>).map((advisor) => advisor.id),
      [pendingProfile.id],
    );

    const verifiedOnly = await request(app).get('/api/admin/advisors?verified=true').set(auth(adminToken));
    assert.equal(verifiedOnly.status, 200);
    assert.deepEqual(
      (verifiedOnly.body.data as Array<{ id: string }>).map((advisor) => advisor.id),
      [verifiedProfile.id],
    );

    const invalidFilter = await request(app).get('/api/admin/advisors?verified=maybe').set(auth(adminToken));
    assert.equal(invalidFilter.status, 400);
  });

  it('verifying an advisor makes them appear in the public marketplace; unverifying removes them', async () => {
    const { token: adminToken } = await createUser('ADMIN', 'Admin A');
    const { profile } = await createAdvisorWithProfile('Round Trip Rita', false);

    const verify = await request(app)
      .patch(`/api/admin/advisors/${profile.id}/verify`)
      .set(auth(adminToken))
      .send({ verified: true });
    assert.equal(verify.status, 200);
    assert.equal(verify.body.data.verified, true);

    const publicAfterVerify = await request(app).get('/api/advisors');
    assert.ok(publicAfterVerify.body.data.some((a: { id: string }) => a.id === profile.id));

    const unverify = await request(app)
      .patch(`/api/admin/advisors/${profile.id}/verify`)
      .set(auth(adminToken))
      .send({ verified: false });
    assert.equal(unverify.status, 200);
    assert.equal(unverify.body.data.verified, false);

    const publicAfterUnverify = await request(app).get('/api/advisors');
    assert.ok(!publicAfterUnverify.body.data.some((a: { id: string }) => a.id === profile.id));
  });

  it('verification is idempotent — verifying twice succeeds and does not duplicate', async () => {
    const { token: adminToken } = await createUser('ADMIN', 'Admin A');
    const { profile } = await createAdvisorWithProfile('Idempotent Ivy', false);

    for (let i = 0; i < 2; i++) {
      const res = await request(app)
        .patch(`/api/admin/advisors/${profile.id}/verify`)
        .set(auth(adminToken))
        .send({ verified: true });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.verified, true);
    }

    const publicList = await request(app).get('/api/advisors');
    const matches = publicList.body.data.filter((a: { id: string }) => a.id === profile.id);
    assert.equal(matches.length, 1, 'a verified advisor appears exactly once');
  });

  it('the admin advisor endpoints refuse non-admins', async () => {
    const { token: applicantToken } = await createUser('APPLICANT', 'Applicant A');
    const noTokenList = await request(app).get('/api/admin/advisors');
    assert.equal(noTokenList.status, 401);
    const applicantList = await request(app).get('/api/admin/advisors').set(auth(applicantToken));
    assert.equal(applicantList.status, 403);

    const noTokenVerify = await request(app).patch('/api/admin/advisors/some-id/verify').send({ verified: true });
    assert.equal(noTokenVerify.status, 401);
    const applicantVerify = await request(app)
      .patch('/api/admin/advisors/some-id/verify')
      .set(auth(applicantToken))
      .send({ verified: true });
    assert.equal(applicantVerify.status, 403);
  });

  it('an unknown advisor id is not found and a bad body is rejected', async () => {
    const { token: adminToken } = await createUser('ADMIN', 'Admin A');

    const missing = await request(app)
      .patch('/api/admin/advisors/does-not-exist/verify')
      .set(auth(adminToken))
      .send({ verified: true });
    assert.equal(missing.status, 404);

    const badBody = await request(app)
      .patch(`/api/admin/advisors/${(await createAdvisorWithProfile('Bad Body Bea', false)).profile.id}/verify`)
      .set(auth(adminToken))
      .send({ verified: 'yes' });
    assert.equal(badBody.status, 400);
  });
});
