import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { prisma } from '../lib/prisma';
import { app, request, resetDb, createUser, auth } from './helpers';

describe('admin namespace guard', () => {
  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('a request into the admin namespace with no token is refused as unauthenticated', async () => {
    const res = await request(app).get('/api/admin/ping');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('an applicant token is refused as forbidden', async () => {
    const { token } = await createUser('APPLICANT', 'Applicant A');
    const res = await request(app).get('/api/admin/ping').set(auth(token));
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('an advisor token is refused as forbidden', async () => {
    const { token } = await createUser('ADVISOR', 'Advisor A');
    const res = await request(app).get('/api/admin/ping').set(auth(token));
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('an admin token reaches the admin namespace', async () => {
    const { token } = await createUser('ADMIN', 'Admin A');
    const res = await request(app).get('/api/admin/ping').set(auth(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.area, 'admin');
  });
});
