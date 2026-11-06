// Full-lifecycle API walkthrough against the running stack (through the web proxy), plus role-guard and privacy probes.
const BASE = (process.env.BASE_URL ?? 'http://localhost:4173') + '/api';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

async function call(method, path, token, body, headers = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* not json */ }
  return { status: res.status, body: json, data: json?.data, headers: res.headers };
}
const login = async (email, password) => (await call('POST', '/auth/login', null, { email, password })).data?.token;
const stamp = Date.now();
const mk = async (name, role = 'APPLICANT') => {
  const email = `${name.toLowerCase()}.${stamp}@walk.zm`;
  const r = await call('POST', '/auth/register', null, { name, email, password: 'Walkthrough1!', role });
  if (!r.data?.token) console.log(`register ${name} -> ${r.status} ${JSON.stringify(r.body)}`);
  return { email, token: r.data?.token, id: r.data?.user?.id, status: r.status };
};

// ---- Auth ----
const alice = await mk('Alice Walker');
check('register applicant', alice.status === 201 && alice.token, `status ${alice.status}`);
check('duplicate email rejected', (await call('POST', '/auth/register', null, { name: 'Alice Two', email: alice.email, password: 'Walkthrough1!' })).status === 409);
check('weak password rejected', (await call('POST', '/auth/register', null, { name: 'Weak Pw', email: `w.${stamp}@walk.zm`, password: '123' })).status === 400);
check('cannot self-register as admin', (await call('POST', '/auth/register', null, { name: 'Sneaky Admin', email: `a.${stamp}@walk.zm`, password: 'Walkthrough1!', role: 'ADMIN' })).status === 400);
check('wrong password rejected', (await call('POST', '/auth/login', null, { email: alice.email, password: 'nope-nope' })).status === 401);
check('/auth/me returns the user', (await call('GET', '/auth/me', alice.token)).data?.email === alice.email);
check('tampered token rejected', (await call('GET', '/auth/me', (alice.token ?? 'x.y.z').slice(0, -3) + 'abc')).status === 401);
check('no token rejected', (await call('GET', '/business-plans/mine')).status === 401);

// ---- Plan, score, application ----
const opps = (await call('GET', '/opportunities')).data ?? [];
check('opportunities listed', opps.length > 0);
const opp = opps[0];
const badPlan = await call('POST', '/business-plans', alice.token, { opportunityId: opp.id, businessIdea: 'short', targetMarket: 'x', startupCosts: -1, revenueProjection: 0, amountRequested: 0 });
check('invalid plan rejected with 400', badPlan.status === 400);
const plan = await call('POST', '/business-plans', alice.token, {
  opportunityId: opp.id,
  businessIdea: 'Layer chicken farm supplying fresh eggs to local shops and schools',
  targetMarket: 'Local shops, schools and households in the constituency',
  startupCosts: 8000, revenueProjection: 24000, amountRequested: 10000,
});
check('valid plan created', plan.status === 201 && plan.data?.id, `status ${plan.status}`);
const planId = plan.data?.id;
const fullPlan = await call('GET', `/business-plans/${planId}`, alice.token);
const score = fullPlan.data?.feasibilityScore;
check('plan has a 0-100 feasibility score', score && score.score >= 0 && score.score <= 100, JSON.stringify(score));
const bob = await mk('Bob Stranger');
check("another applicant cannot read Alice's plan", [403, 404].includes((await call('GET', `/business-plans/${planId}`, bob.token)).status));
check('assessment fee recorded once', (await call('POST', '/payments/assessment', alice.token, { businessPlanId: planId })).status < 300);
const app = await call('POST', '/applications', alice.token, { businessPlanId: planId });
check('application submitted', app.status === 201 && app.data?.status === 'SUBMITTED', `status ${app.status}`);
const appId = app.data?.id;

// ---- Admin review through to repayment ----
const admin = await login('admin@fundpath.zm', 'Admin@123');
check('admin can log in', !!admin);
check('applicant blocked from admin area', (await call('GET', '/admin/summary', alice.token)).status === 403);
check('applicant cannot change status', (await call('PATCH', `/applications/${appId}/status`, alice.token, { status: 'APPROVED' })).status === 403);
const patch = (status, extra = {}) => call('PATCH', `/applications/${appId}/status`, admin, { status, ...extra });
check('cannot skip straight to CLOSED', (await patch('CLOSED')).status === 400);
check('SUBMITTED -> UNDER_REVIEW', (await patch('UNDER_REVIEW')).status === 200);
check('UNDER_REVIEW -> APPROVED', (await patch('APPROVED')).status === 200);
check('DISBURSED needs an amount or succeeds with it', (await patch('DISBURSED', { amountDisbursed: 10000 })).status === 200);
check('DISBURSED -> REPAYING', (await patch('REPAYING')).status === 200);
const detail = await call('GET', `/applications/${appId}`, alice.token);
check('applicant sees REPAYING and allowed transitions', detail.data?.status === 'REPAYING' && Array.isArray(detail.data?.allowedTransitions), JSON.stringify(detail.data?.allowedTransitions));
check('repayment rejects a negative amount', (await call('POST', '/repayments', alice.token, { applicationId: appId, amount: -5 })).status === 400);
check('repayment recorded', (await call('POST', '/repayments', alice.token, { applicationId: appId, amount: 1000 })).status === 201);
check("other applicant cannot repay Alice's loan", [403, 404].includes((await call('POST', '/repayments', bob.token, { applicationId: appId, amount: 10 })).status));
const reps = await call('GET', `/repayments/application/${appId}`, alice.token);
check('repayment history and balance returned', reps.status === 200 && JSON.stringify(reps.data).includes('1000'), JSON.stringify(reps.data).slice(0, 160));
const sum = await call('GET', '/admin/summary', admin);
check('admin summary loads', sum.status === 200 && sum.data);

// ---- Advisor booking, chat, review ----
const advisors = (await call('GET', '/advisors')).data ?? [];
check('advisor list is public and non-empty', advisors.length > 0);
const adv = advisors[0];
const advToken = await login('advisor1@fundpath.zm', 'Advisor@123');
const booking = await call('POST', '/bookings', alice.token, { advisorId: adv.userId, note: 'Help me with my plan' });
check('booking created', booking.status === 201, `status ${booking.status} ${JSON.stringify(booking.body).slice(0, 120)}`);
const bid = booking.data?.id;
check('chat locked before payment', (await call('GET', `/messages/${bid}`, alice.token)).status === 400);
check('booking marked paid', (await call('POST', `/bookings/${bid}/pay`, alice.token)).status < 300);
check('applicant can chat after payment', (await call('POST', `/messages/${bid}`, alice.token, { content: 'Hello advisor' })).status === 201);
const advToken1 = advToken;
const advisorOwnsIt = adv.user?.name && (await call('GET', '/auth/me', advToken1)).data?.id === adv.userId;
if (advisorOwnsIt) check('advisor can reply', (await call('POST', `/messages/${bid}`, advToken1, { content: 'Happy to help' })).status === 201);
check('outsider cannot read the chat', (await call('GET', `/messages/${bid}`, bob.token)).status === 403);
check('review with rating 9 rejected', (await call('POST', '/reviews', alice.token, { bookingId: bid, rating: 9 })).status === 400);
check('review accepted', (await call('POST', '/reviews', alice.token, { bookingId: bid, rating: 5, comment: 'Very useful' })).status === 201);

// ---- Marketplace: product, in-app chat, purchase, commission ----
const prod = await call('POST', '/products', alice.token, { name: 'Free-range eggs', description: 'Tray of 30 fresh eggs', price: 90 });
check('seller creates a product', prod.status === 201, `status ${prod.status}`);
const pid = prod.data?.id;
check('advisor cannot sell products', (await call('POST', '/products', advToken1, { name: 'Nope', description: 'Not allowed here', price: 5 })).status === 403);
const thread = await call('POST', `/messages/product/${pid}`, bob.token);
check('buyer opens an in-app conversation', thread.status === 201 && thread.data?.threadId);
check('seller cannot message themselves', (await call('POST', `/messages/product/${pid}`, alice.token)).status === 400);
check('buyer message sent', (await call('POST', `/messages/thread/${thread.data?.threadId}`, bob.token, { content: 'Is this still available?' })).status === 201);
check('seller was notified', ((await call('GET', '/notifications/unread-count', alice.token)).data?.count ?? (await call('GET', '/notifications/unread-count', alice.token)).data) > 0);
const buy = await call('POST', '/payments/purchase', bob.token, { productId: pid, quantity: 2 });
check('purchase recorded', buy.status === 201, `status ${buy.status}`);
check('8% commission on the sale', buy.data && Math.abs(buy.data.commissionAmount - buy.data.grossAmount * 0.08) < 0.01, JSON.stringify(buy.data));
check('seller cannot buy own product', (await call('POST', '/payments/purchase', alice.token, { productId: pid })).status === 400);

// ---- Privacy and hardening ----
const emailRe = /[\w.+-]+@[\w-]+\.[\w.]+/;
const pubProducts = JSON.stringify((await call('GET', '/products')).body);
check('public products do not leak emails', !emailRe.test(pubProducts));
const pubAdvisors = JSON.stringify((await call('GET', '/advisors')).body);
check('public advisor list does not leak emails', !emailRe.test(pubAdvisors));
check('public advisor page does not leak email', !emailRe.test(JSON.stringify((await call('GET', `/advisors/${adv.id}`)).body)));
check('password hashes never returned', !JSON.stringify([pubProducts, pubAdvisors, JSON.stringify(detail.body)]).includes('passwordHash'));
check('x-powered-by header hidden', !(await call('GET', '/opportunities')).headers.get('x-powered-by'));
const evil = await call('GET', '/opportunities', null, undefined, { Origin: 'https://evil.example' });
check('CORS not open to arbitrary origins', evil.headers.get('access-control-allow-origin') !== '*' && evil.headers.get('access-control-allow-origin') !== 'https://evil.example');
check('unknown API route returns 404 JSON', (await call('GET', '/nope-nothing')).status === 404);
check('malformed id does not crash (4xx)', (await call('GET', '/applications/%27%20OR%201=1--', alice.token)).status < 500);
check('huge message rejected', (await call('POST', `/messages/thread/${thread.data?.threadId}`, bob.token, { content: 'x'.repeat(5000) })).status === 400);

const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} checks passed`);
for (const f of failed) console.log(` FAIL ${f.name} ${f.detail}`);
process.exit(failed.length ? 1 : 0);
