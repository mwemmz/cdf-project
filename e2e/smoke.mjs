// Browser smoke test: logs in as each seeded role, visits pages, reports console/API errors and horizontal overflow.
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = process.env.OUT_DIR ?? 'e2e-out';
fs.mkdirSync(OUT, { recursive: true });

const accounts = {
  applicant: ['applicant@fundpath.zm', 'Applicant@123'],
  advisor: ['advisor1@fundpath.zm', 'Advisor@123'],
  admin: ['admin@fundpath.zm', 'Admin@123'],
};
const pages = {
  public: ['/', '/login', '/register', '/opportunities', '/advisors', '/marketplace', '/success-stories', '/resources'],
  applicant: ['/plans', '/plans/new', '/applications', '/bookings', '/messages', '/storefront'],
  advisor: ['/advisor/dashboard', '/advisors/me', '/messages', '/bookings'],
  admin: ['/admin', '/admin/applications', '/admin/advisors', '/admin/opportunities', '/admin/revenue'],
};
const sizes = { desktop: { width: 1280, height: 800 }, phone: { width: 390, height: 844 } };

const problems = [];
let visited = 0;
const browser = await chromium.launch();

async function visit(ctx, role, path, sizeName) {
  const page = await ctx.newPage();
  await page.setViewportSize(sizes[sizeName]);
  const tag = `${role}:${sizeName}:${path}`;
  page.on('pageerror', (e) => problems.push(`${tag} pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) problems.push(`${tag} console: ${m.text().slice(0, 200)}`); });
  page.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 400) problems.push(`${tag} api ${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`);
  });
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => ({
    over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    text: document.body.innerText.slice(0, 4000),
  }));
  if (info.over > 1) problems.push(`${tag} horizontal overflow ${info.over}px`);
  if (/Request failed|Something went wrong|Cannot read|undefined/i.test(info.text)) problems.push(`${tag} error text on page`);
  if (role === 'admin' && path === '/admin' && !info.text.includes('What FundPath earns')) problems.push(`${tag} missing earnings panel`);
  if (info.text.trim().length < 40) problems.push(`${tag} page looks empty`);
  await page.screenshot({ path: `${OUT}/${role}-${sizeName}-${path.replace(/\W+/g, '_') || 'home'}.png` });
  visited++;
  await page.close();
}

for (const sizeName of Object.keys(sizes)) {
  const anon = await browser.newContext();
  for (const p of pages.public) await visit(anon, 'public', p, sizeName);
  await anon.close();
  for (const role of Object.keys(accounts)) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.setViewportSize(sizes[sizeName]);
    await page.goto(BASE + '/login');
    await page.getByLabel('Email').fill(accounts[role][0]);
    await page.getByLabel('Password').fill(accounts[role][1]);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    try { await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 8000 }); }
    catch { problems.push(`${role}:${sizeName} login did not leave /login`); await ctx.close(); continue; }
    await page.close();
    for (const p of pages[role]) await visit(ctx, role, p, sizeName);
    await ctx.close();
  }
}
// Flow: a buyer messages a seller from the marketplace, in the app.
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 400) problems.push(`chat-flow api ${r.status()} ${new URL(r.url()).pathname}`); });
  await page.goto(BASE + '/login');
  await page.getByLabel('Email').fill(accounts.applicant[0]);
  await page.getByLabel('Password').fill(accounts.applicant[1]);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 8000 });
  await page.goto(BASE + '/marketplace', { waitUntil: 'networkidle' });
  const btn = page.getByRole('button', { name: 'Message seller' }).first();
  if (!(await btn.count())) problems.push('chat-flow: no "Message seller" button on marketplace');
  else {
    await btn.click();
    try {
      await page.waitForURL(/\/messages\?thread=/, { timeout: 8000 });
      const text = `Hello from the smoke test ${Date.now()}`;
      await page.getByPlaceholder(/message|type/i).first().fill(text);
      await page.getByRole('button', { name: /send/i }).click();
      await page.getByText(text).first().waitFor({ timeout: 8000 });
      await page.screenshot({ path: `${OUT}/chat-flow.png` });
      visited++;
    } catch (e) { problems.push(`chat-flow failed: ${String(e.message).split('\n')[0]}`); }
  }
  await ctx.close();
}
await browser.close();

fs.writeFileSync(`${OUT}/report.txt`, `visited ${visited} pages\n${problems.join('\n')}\n`);
console.log(`visited ${visited} pages, ${problems.length} problems`);
for (const p of problems) console.log(' -', p);
process.exit(problems.length ? 1 : 0);
