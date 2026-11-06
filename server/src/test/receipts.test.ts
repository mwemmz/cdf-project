import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { prisma } from '../lib/prisma';
import { app, request, resetDb, createUser, auth } from './helpers';
import { normalisePhone, simulateMomo } from '../modules/payments/momo';

async function setup() {
  const { user: seller, token: sellerToken } = await createUser('APPLICANT', 'Seller One');
  const { token: buyerToken } = await createUser('APPLICANT', 'Buyer One');
  const { token: otherToken } = await createUser('APPLICANT', 'Outsider');
  const { token: adminToken } = await createUser('ADMIN', 'Admin');
  const product = await prisma.product.create({
    data: { applicantId: seller.id, name: 'Free-range eggs', description: 'Tray of 30', price: 90 },
  });
  return { sellerToken, buyerToken, otherToken, adminToken, product };
}

describe('mobile money simulation and receipts', () => {
  before(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb();
  });
  after(async () => {
    await prisma.$disconnect();
  });

  it('normalises Zambian numbers and detects the network', () => {
    assert.equal(normalisePhone('+260 97 123 4567'), '971234567');
    assert.equal(normalisePhone('0961234567'), '961234567');
    assert.equal(simulateMomo({ phone: '0961234567' }).provider, 'MTN');
    assert.equal(simulateMomo({ phone: '0771234567' }).provider, 'AIRTEL');
    assert.equal(simulateMomo({ phone: '0951234567' }).provider, 'ZAMTEL');
    assert.throws(() => normalisePhone('12345'));
    assert.throws(() => simulateMomo({ phone: '0971234567', provider: 'MTN' }));
  });

  it('a mobile money purchase stores a masked number and a receipt', async () => {
    const { buyerToken, product } = await setup();
    const res = await request(app)
      .post('/api/payments/purchase')
      .set(auth(buyerToken))
      .send({ productId: product.id, quantity: 2, payment: { phone: '0971234567', provider: 'AIRTEL' } });
    assert.equal(res.status, 201);
    assert.match(res.body.data.receiptNo, /^FP-\d{8}-[0-9A-F]{6}$/);
    assert.equal(res.body.data.method, 'MOBILE_MONEY');
    assert.equal(res.body.data.provider, 'AIRTEL');
    assert.ok(!JSON.stringify(res.body.data).includes('971234567'), 'full number must not be stored');
    assert.ok(res.body.data.providerRef);
  });

  it('rejects a number that is not a real mobile money number', async () => {
    const { buyerToken, product } = await setup();
    const res = await request(app)
      .post('/api/payments/purchase')
      .set(auth(buyerToken))
      .send({ productId: product.id, payment: { phone: '12345' } });
    assert.equal(res.status, 400);
    assert.equal(await prisma.transaction.count(), 0);
  });

  it('a payment without mobile money details still gets a receipt', async () => {
    const { buyerToken, product } = await setup();
    const res = await request(app).post('/api/payments/purchase').set(auth(buyerToken)).send({ productId: product.id });
    assert.equal(res.status, 201);
    assert.ok(res.body.data.receiptNo);
    assert.equal(res.body.data.method, 'SIMULATED');
  });

  it('only the payer, the payee and an admin can open a receipt', async () => {
    const { buyerToken, sellerToken, otherToken, adminToken, product } = await setup();
    const buy = await request(app).post('/api/payments/purchase').set(auth(buyerToken)).send({ productId: product.id });
    const id = buy.body.data.id;
    for (const t of [buyerToken, sellerToken, adminToken]) {
      const r = await request(app).get(`/api/payments/${id}/receipt`).set(auth(t));
      assert.equal(r.status, 200);
      assert.equal(r.body.data.id, id);
    }
    assert.equal((await request(app).get(`/api/payments/${id}/receipt`).set(auth(otherToken))).status, 403);
    assert.equal((await request(app).get(`/api/payments/${id}/receipt`)).status, 401);
    assert.equal((await request(app).get('/api/payments/nope/receipt').set(auth(buyerToken))).status, 404);
  });
});
