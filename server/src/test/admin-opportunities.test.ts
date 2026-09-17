import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { prisma } from '../lib/prisma';
import { app, request, resetDb, createUser, auth, createOpportunity } from './helpers';

describe('admin opportunity management', () => {
  let adminToken: string;

  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb();
    ({ token: adminToken } = await createUser('ADMIN', 'Admin A'));
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('rejects a blank constituency', async () => {
    const res = await request(app)
      .post('/api/admin/opportunities')
      .set(auth(adminToken))
      .send({ constituencyName: '   ', category: 'Agriculture', amountAvailable: 50000, deadline: '2030-06-30' });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('rejects a negative amount', async () => {
    const res = await request(app)
      .post('/api/admin/opportunities')
      .set(auth(adminToken))
      .send({ constituencyName: 'Mandevu', category: 'Agriculture', amountAvailable: -5, deadline: '2030-06-30' });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('rejects an unparseable deadline', async () => {
    const res = await request(app)
      .post('/api/admin/opportunities')
      .set(auth(adminToken))
      .send({ constituencyName: 'Mandevu', category: 'Agriculture', amountAvailable: 50000, deadline: 'not-a-date' });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('creates an opportunity that is then publicly visible', async () => {
    const res = await request(app)
      .post('/api/admin/opportunities')
      .set(auth(adminToken))
      .send({ constituencyName: 'Chilenje', category: 'Retail', amountAvailable: 75000, deadline: '2031-01-31' });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.constituencyName, 'Chilenje');

    const publicList = await request(app).get('/api/opportunities');
    assert.equal(publicList.status, 200);
    const found = publicList.body.data.find(
      (o: { constituencyName: string }) => o.constituencyName === 'Chilenje',
    );
    assert.ok(found, 'created opportunity should appear on the public list');
    assert.equal(found.amountAvailable, 75000);
  });

  it('edits an existing opportunity', async () => {
    const opportunity = await createOpportunity({ amountAvailable: 50000 });
    const res = await request(app)
      .patch(`/api/admin/opportunities/${opportunity.id}`)
      .set(auth(adminToken))
      .send({ amountAvailable: 60000 });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.amountAvailable, 60000);

    const stored = await prisma.opportunity.findUnique({ where: { id: opportunity.id } });
    assert.equal(stored?.amountAvailable, 60000);
  });

  it('editing an unknown opportunity is a 404', async () => {
    const res = await request(app)
      .patch('/api/admin/opportunities/does-not-exist')
      .set(auth(adminToken))
      .send({ amountAvailable: 60000 });
    assert.equal(res.status, 404);
  });

  it('the authorization matrix holds: no token and non-admin tokens are refused', async () => {
    const noToken = await request(app).post('/api/admin/opportunities').send({});
    assert.equal(noToken.status, 401);

    const { token: applicantToken } = await createUser('APPLICANT', 'Applicant A');
    const forbidden = await request(app)
      .post('/api/admin/opportunities')
      .set(auth(applicantToken))
      .send({ constituencyName: 'Mandevu', category: 'Agri', amountAvailable: 1, deadline: '2030-06-30' });
    assert.equal(forbidden.status, 403);
  });
});
