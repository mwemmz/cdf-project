import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { prisma } from '../lib/prisma';
import { app, request, resetDb, createUser, auth } from './helpers';

async function setup() {
  const { user: seller, token: sellerToken } = await createUser('APPLICANT', 'Seller One');
  const { user: buyer, token: buyerToken } = await createUser('APPLICANT', 'Buyer One');
  const { token: otherToken } = await createUser('APPLICANT', 'Outsider');
  const product = await prisma.product.create({
    data: { applicantId: seller.id, name: 'Free-range eggs', description: 'Tray of 30', price: 90 },
  });
  return { seller, sellerToken, buyer, buyerToken, otherToken, product };
}

describe('marketplace chat: buyer and seller', () => {
  before(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb();
  });
  after(async () => {
    await prisma.$disconnect();
  });

  it('requires sign-in to open a conversation', async () => {
    const { product } = await setup();
    const res = await request(app).post(`/api/messages/product/${product.id}`);
    assert.equal(res.status, 401);
  });

  it('opens one conversation per buyer and product, and reuses it', async () => {
    const { product, buyerToken } = await setup();
    const a = await request(app).post(`/api/messages/product/${product.id}`).set(auth(buyerToken));
    const b = await request(app).post(`/api/messages/product/${product.id}`).set(auth(buyerToken));
    assert.equal(a.status, 201);
    assert.equal(b.status, 201);
    assert.equal(a.body.data.threadId, b.body.data.threadId);
    assert.equal(await prisma.productThread.count(), 1);
  });

  it('rejects messaging your own product and unknown products', async () => {
    const { product, sellerToken, buyerToken } = await setup();
    const own = await request(app).post(`/api/messages/product/${product.id}`).set(auth(sellerToken));
    assert.equal(own.status, 400);
    const missing = await request(app).post('/api/messages/product/nope').set(auth(buyerToken));
    assert.equal(missing.status, 404);
  });

  it('lets both sides exchange messages, notifies the recipient, and blocks outsiders', async () => {
    const { seller, product, sellerToken, buyerToken, otherToken } = await setup();
    const { body } = await request(app).post(`/api/messages/product/${product.id}`).set(auth(buyerToken));
    const id = body.data.threadId as string;

    const sent = await request(app).post(`/api/messages/thread/${id}`).set(auth(buyerToken)).send({ content: 'Is it available?' });
    assert.equal(sent.status, 201);
    assert.equal(await prisma.notification.count({ where: { userId: seller.id, type: 'NEW_MESSAGE' } }), 1);

    const reply = await request(app).post(`/api/messages/thread/${id}`).set(auth(sellerToken)).send({ content: 'Yes, come tomorrow.' });
    assert.equal(reply.status, 201);

    const list = await request(app).get(`/api/messages/thread/${id}`).set(auth(buyerToken));
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.data.map((m: { content: string }) => m.content), ['Is it available?', 'Yes, come tomorrow.']);

    assert.equal((await request(app).get(`/api/messages/thread/${id}`).set(auth(otherToken))).status, 403);
    assert.equal((await request(app).post(`/api/messages/thread/${id}`).set(auth(otherToken)).send({ content: 'hi' })).status, 403);
    assert.equal((await request(app).post(`/api/messages/thread/${id}`).set(auth(buyerToken)).send({ content: '   ' })).status, 400);
  });

  it('shows the conversation in both inboxes with the product name', async () => {
    const { product, sellerToken, buyerToken, otherToken } = await setup();
    const { body } = await request(app).post(`/api/messages/product/${product.id}`).set(auth(buyerToken));
    await request(app).post(`/api/messages/thread/${body.data.threadId}`).set(auth(buyerToken)).send({ content: 'Hello' });

    const buyerInbox = await request(app).get('/api/messages').set(auth(buyerToken));
    const sellerInbox = await request(app).get('/api/messages').set(auth(sellerToken));
    const otherInbox = await request(app).get('/api/messages').set(auth(otherToken));
    assert.equal(buyerInbox.body.data.length, 1);
    assert.equal(buyerInbox.body.data[0].kind, 'product');
    assert.equal(buyerInbox.body.data[0].productName, 'Free-range eggs');
    assert.equal(buyerInbox.body.data[0].other.name, 'Seller One');
    assert.equal(sellerInbox.body.data[0].other.name, 'Buyer One');
    assert.equal(sellerInbox.body.data[0].lastMessage.content, 'Hello');
    assert.equal(otherInbox.body.data.length, 0);
  });
});
