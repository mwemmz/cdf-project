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
  applicant: ['/plans', '/plans/new', '/applications', '/bookings', '/messages', '/receipts', '/storefront'],
  advisor: ['/advisor/dashboard', '/advisors/me', '/messages', '/bookings', '/receipts'],
  admin: ['/admin', '/admin/applications', '/admin/advisors', '/admin/opportunities', '/admin/revenue'],
};
const sizes = { desktop: { width: 1280, height: 800 }, phone: { width: 390, height: 844 } };

const problems = [];
let visited = 0;
const browser = await chromium.launch();


// Text/background contrast audit (WCAG AA). Translucent layers are composited, then the worst case of a white or black photo behind is used.
const contrastIssues = new Map();
async function auditContrast(page, tag) {
  const found = await page.evaluate(() => {
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r, g, b, a }; };
    const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const over = (top, base) => ({ r: top.r * top.a + base.r * (1 - top.a), g: top.g * top.a + base.g * (1 - top.a), b: top.b * top.a + base.b * (1 - top.a), a: 1 });
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) {
      const n = walker.currentNode; const t = n.textContent.trim(); if (t.length < 2) continue;
      const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      if (cs.visibility === 'hidden' || cs.display === 'none' || r.width < 2 || r.height < 2 || +cs.opacity === 0) continue;
      if (['SCRIPT', 'STYLE', 'OPTION'].includes(el.tagName) || el.closest('button:disabled, [aria-disabled="true"]')) continue;
      const fg0 = parse(cs.color); if (!fg0) continue;
      const layers = []; let hasImage = false;
      for (let e = el; e; e = e.parentElement) {
        const bs = getComputedStyle(e); const bg = parse(bs.backgroundColor);
        if (bs.backgroundImage !== 'none' && !bs.backgroundImage.includes('gradient')) hasImage = true;
        if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
      }
      let worst = 99;
      for (const base of [{ r: 255, g: 255, b: 255, a: 1 }, { r: 0, g: 0, b: 0, a: 1 }]) {
        let bg = base; for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
        const fg = over({ ...fg0, a: fg0.a * (+cs.opacity || 1) }, bg);
        worst = Math.min(worst, ratio(fg, bg));
      }
      const size = parseFloat(cs.fontSize); const bold = +cs.fontWeight >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      if (worst < need) out.push({ sel: `${el.tagName.toLowerCase()}.${String(el.className).split(/\s+/).slice(0, 4).join('.')}`, text: t.slice(0, 40), ratio: Math.round(worst * 100) / 100, need, color: cs.color });
    }
    return out;
  });
  for (const f of found) {
    const key = `${f.sel} | ${f.color}`;
    const cur = contrastIssues.get(key) ?? { ...f, pages: new Set() };
    cur.pages.add(tag); cur.ratio = Math.min(cur.ratio, f.ratio);
    contrastIssues.set(key, cur);
  }
}

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
  await auditContrast(page, `${role}:${sizeName}:${path}`);
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

  // ---- Mobile money purchase and receipt ----
  try {
    await page.goto(BASE + '/marketplace', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Buy with mobile money' }).first().click();
    await page.getByRole('dialog').waitFor({ timeout: 5000 });
    await auditContrast(page, 'applicant:desktop:payment-popup');
    await page.getByRole('button', { name: /^Pay / }).click();
    if (!(await page.getByText(/valid mobile money number|10-digit/i).count())) problems.push('payment: empty number was not rejected');
    await page.getByPlaceholder('97 123 4567').fill('0971234567');
    await page.getByRole('button', { name: /^Pay / }).click();
    await page.getByText('Check your phone').waitFor({ timeout: 5000 });
    await page.getByRole('link', { name: 'View receipt' }).waitFor({ timeout: 10000 });
    await page.getByRole('link', { name: 'View receipt' }).click();
    await page.getByText('Receipt no.').waitFor({ timeout: 8000 });
    const rtext = await page.locator('main').innerText();
    if (!/FP-\d{8}-[0-9A-F]{6}/.test(rtext)) problems.push('receipt: missing receipt number');
    if (!/FundPath fee \(8%\)/.test(rtext)) problems.push('receipt: missing 8% service fee line');
    if (!/Airtel Money/.test(rtext)) problems.push('receipt: network not shown');
    if (rtext.includes('971234567') || rtext.includes('0971234567')) problems.push('receipt: full phone number leaked');
    await auditContrast(page, 'applicant:desktop:receipt');
    await page.screenshot({ path: `${OUT}/receipt.png` });
    await page.goto(BASE + '/receipts', { waitUntil: 'networkidle' });
    if (!(await page.getByText(/FP-\d{8}/).count())) problems.push('receipts list: new receipt not listed');
    visited += 2;
  } catch (e) { problems.push(`payment-flow failed: ${String(e.message).split('\n')[0]}`); }

  // ---- Bookings are grouped: awaiting payment, then paid ----
  try {
    const login = await (await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: accounts.applicant[0], password: accounts.applicant[1] }) })).json();
    const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${login.data.token}` };
    const advs = (await (await fetch(BASE + '/api/advisors')).json()).data;
    const mkb = async (note) => (await (await fetch(BASE + '/api/bookings', { method: 'POST', headers: H, body: JSON.stringify({ advisorId: advs[0].userId, note }) })).json()).data;
    const older = await mkb('smoke older, stays pending');
    const newer = await mkb('smoke newer, gets paid');
    await fetch(`${BASE}/api/bookings/${newer.id}/pay`, { method: 'POST', headers: H, body: JSON.stringify({ payment: { phone: '0961234567' } }) });
    await page.goto(BASE + '/bookings', { waitUntil: 'networkidle' });
    const heads = await page.locator('main h2').allInnerTexts();
    const iPending = heads.findIndex((t) => /awaiting payment/i.test(t));
    const iPaid = heads.findIndex((t) => /^paid/i.test(t));
    if (iPending < 0 || iPaid < 0 || iPending > iPaid) problems.push(`bookings: not grouped pending-first (${heads.join(' | ')})`);
    const body = await page.locator('main').innerText();
    if (body.indexOf('smoke older') > body.indexOf('smoke newer')) problems.push('bookings: pending booking should come before the newer paid one');
    await auditContrast(page, 'applicant:desktop:bookings-grouped');
    await page.screenshot({ path: `${OUT}/bookings-grouped.png` });
    visited++;
  } catch (e) { problems.push(`bookings-order failed: ${String(e.message).split('\n')[0]}`); }
  await ctx.close();
}
await browser.close();

if (contrastIssues.size) {
  console.log(`CONTRAST: ${contrastIssues.size} distinct low-contrast text styles`);
  for (const [, v] of [...contrastIssues].sort((a, b) => a[1].ratio - b[1].ratio)) console.log(`  CONTRAST ${v.ratio}:1 (need ${v.need}) ${v.sel} color ${v.color} "${v.text}" on ${[...v.pages].slice(0, 3).join(', ')}${v.pages.size > 3 ? ` +${v.pages.size - 3}` : ''}`);
  if (process.env.CONTRAST_STRICT !== '0') problems.push(`${contrastIssues.size} low-contrast text styles`);
}
fs.writeFileSync(`${OUT}/report.txt`, `visited ${visited} pages\n${problems.join('\n')}\n`);
console.log(`visited ${visited} pages, ${problems.length} problems`);
for (const p of problems) console.log(' -', p);
process.exit(problems.length ? 1 : 0);
