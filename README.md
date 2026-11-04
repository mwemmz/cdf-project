# FundPath — CDF Loan-to-Repayment Platform

FundPath helps Zambian applicants apply for Constituency Development Fund (CDF) opportunities:
build and score a business plan, book sessions with verified advisors, track an application
through the CDF decision process, and plan and log repayment if a loan is granted. FundPath is
**not the lender**: the CDF committee shortlists, a bank appraises, the Provincial Local Government
Officer approves and the bank disburses (see "How CDF works in real life" below). See
[`docs/business-model.md`](./docs/business-model.md).

Delivered as one cohesive full-stack slice covering two developers' scope:

- **Dev 1 — core backend & data layer:** Prisma schema, migrations, seeding, auth (JWT + bcrypt,
  role-based access), opportunities, business plan builder, rules-based feasibility scoring.
- **Dev 2 — marketplace & transactions:** advisor marketplace & bookings, applications/loan
  tracking, repayments, and the public storefront.

An **ecosystem layer** connects the two sides so the platform feels like one product:

- **Chat** — once a booking is paid, the applicant and advisor get a private thread.
- **Messages inbox** — a dedicated `/messages` page listing every conversation with its latest
  message, with the chat open beside it (applicants and advisors).
- **Simulated payments & commissions** — a ledger of what FundPath *would* collect: 15% of paid
  advisor sessions, 8% of marketplace sales, and a flat K150 plan, risk and market assessment
  fee paid by the business owner. No real money moves; see
  [Simulated payments](#simulated-payments-and-commission) below.
- **Notifications** — an in-app bell with unread counts (feasibility ready, status changes, new
  messages, new reviews, repayment reminders).
- **Repayment reminders & progress bar** — a schedule from the CDF guideline terms (5% simple interest, 12 to 36 months by loan size, first instalment at 60 days), an on-track/behind
  progress bar, and reminders when a payment is due within 7 days or overdue.
- **Advisor ratings** — applicants review a paid session; public 1–5 star averages on the
  marketplace and advisor pages.
- **Advisor dashboard** — advisors see their clients, plan scores and pipeline at a glance.
- **Advisor business tools** — co-edit a linked client's plan (with automatic re-scoring and a
  notification) plus a break-even calculator.
- **Success stories** — a public showcase of funded businesses at least 50% repaid, linking to
  their marketplace storefront.
- **Resource library** — short, filterable guides for applicants and funded businesses.

- **Admin & analytics** — an `/admin` area (ADMIN role only): dashboard with pipeline, money and
  feasibility charts (inline SVG, no chart library), a cross-applicant review queue with legal
  status transitions, advisor verification (unverified advisors included), and opportunity
  create/edit, and a **Revenue** tab showing simulated commission by stream. Spec: [`docs/specs/dev3-admin-dashboard.md`](./docs/specs/dev3-admin-dashboard.md).

## Tech stack

| Layer     | Tech                                                          |
| --------- | ------------------------------------------------------------- |
| Frontend  | React 18 + Vite + TypeScript, Tailwind CSS, React Router      |
| Backend   | Node.js + Express + TypeScript (tsx for dev)                  |
| Database  | PostgreSQL (hosted on Neon)                                   |
| ORM       | Prisma 5                                                     |
| Auth      | JWT, bcrypt password hashing, role-based access (applicant / advisor / admin) |
| Validation| zod (all form/endpoint input)                                 |

## Project structure

```
.
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # one page per feature
│   │   ├── components/     # layout, UI primitives, pipeline tracker
│   │   ├── context/        # auth context
│   │   └── lib/            # api client, auth helpers, types, formatters
│   └── vite.config.ts      # dev proxy /api -> :4000
├── server/                 # Express backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/     # includes the initial migration
│   └── src/
│       ├── middleware/     # auth (JWT + roles), validation, error handling
│       ├── lib/            # prisma client, jwt helpers
│       └── modules/        # auth, opportunities, businessPlans, feasibility,
│                           # advisors, bookings, applications, repayments, products,
│                           # messages, notifications, reviews, showcase, resources,
│                           # payments (simulated commission ledger)
└── README.md
```

## Prerequisites

- Node.js 18+ (tested on 24) and `pnpm` (or npm — swap the commands below)
- A PostgreSQL database (this project targets [Neon](https://neon.tech))

## 1. Database setup

1. Create a Postgres database (e.g. on Neon) and grab its connection string:
   `postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require`
2. Configure the server environment:

```bash
cd server
copy .env.example .env     # Windows
# fill in DATABASE_URL and set a long random JWT_SECRET
```

`.env` is gitignored; only `.env.example` is committed.

3. Generate the Prisma client and apply the initial migration, then seed:

```bash
pnpm install
pnpm prisma:generate        # prisma generate
pnpm prisma:deploy          # prisma migrate deploy — applies migrations/ to your DB
pnpm seed                   # inserts opportunities, accounts, demo data
```

> The `transactions` table comes from migration `20261104000000_add_transactions`. On Render the
> build step applies it automatically; locally, run `pnpm prisma:deploy`.

> Applying migrations against a fresh DB requires that the initial migration files exist —
> they do (`server/prisma/migrations/`). If you're starting from a different environment you
> already migrated, `pnpm prisma:migrate` creates the next migration from schema changes.

## 2. Run the backend

```bash
cd server
pnpm dev                     # tsx watch -> http://localhost:4000
```

Health check: `GET http://localhost:4000/health`.

## 3. Run the frontend

```bash
cd client
pnpm install
pnpm dev                     # vite -> http://localhost:5173 (proxies /api to :4000)
```

Visit http://localhost:5173.

## Environment variables

### server/.env

| Variable       | Required | Description                                        |
| -------------- | -------- | -------------------------------------------------- |
| `DATABASE_URL` | yes      | PostgreSQL/Neon connection string                  |
| `JWT_SECRET`   | yes      | Secret used to sign JWTs (long random string)      |
| `PORT`         | no       | API port (default 4000)                            |
| `CLIENT_URL`   | no       | CORS origin for the client (default localhost:5173)|

### client/env (optional)

| Variable        | Description                                              |
| --------------- | -------------------------------------------------------- |
| `VITE_API_BASE` | API base URL. Defaults to `/api` (uses the Vite proxy)   |

The ecosystem features and the simulated payments add **no new environment variables** — chat, notifications, reminders,
reviews, the advisor dashboard/tools, success stories and the resource library all run on the
existing database and config.

## Seeded test accounts

| Role      | Email                   | Password       |
| --------- | ----------------------- | -------------- |
| Admin     | admin@fundpath.zm       | Admin@123      |
| Advisor 1 | advisor1@fundpath.zm    | Advisor@123    |
| Advisor 2 | advisor2@fundpath.zm    | Advisor@123    |
| Applicant | applicant@fundpath.zm   | Applicant@123  |

The seed also creates 8 CDF opportunities, three advisor profiles (two **verified** so the
marketplace is testable — admins verify the rest from the admin area), a full application
pipeline across every status, demo storefront products, paid and pending bookings with a chat
thread and reviews, sample notifications, and a 5-article resource library. Two funded
businesses (one repaying, one closed) qualify for the public **Success stories** page.

## API conventions

- Every response uses `{ success: true, data }` or `{ success: false, error, details? }`.
- Errors are JSON: `{ "success": false, "error": "message" }`; validation failures add
  `details: [{ path, message }]`.
- Authenticated endpoints expect `Authorization: Bearer <token>`.
- Money is stored as `Float` (Kwacha, keep it simple).

### Endpoint map

| Method & path                        | Access      | Purpose                                   |
| ------------------------------------ | ----------- | ----------------------------------------- |
| `POST /api/auth/register`            | public      | Register applicant/advisor (JWT+hash)     |
| `POST /api/auth/login`               | public      | Login -> token + user                     |
| `GET /api/auth/me`                   | any auth    | Current user                              |
| `GET /api/opportunities`             | public      | List CDF opportunities                    |
| `GET /api/opportunities/:id`         | public      | Opportunity detail                        |
| `POST /api/business-plans`           | applicant   | Create plan **and auto-run scoring**      |
| `GET /api/business-plans/mine`       | applicant   | My plans (with scores)                    |
| `GET /api/business-plans/:id`        | owner/admin | Plan summary + score + application        |
| `POST /api/business-plans/:id/score` | owner/admin | Recompute & store feasibility score       |
| `GET /api/advisors`                  | public      | Verified advisors + profiles              |
| `GET /api/advisors/:id`              | public      | Advisor profile                           |
| `GET /api/advisors/me`               | advisor     | My profile                                |
| `POST /api/advisors/profile`         | advisor     | Create/update my profile                   |
| `POST /api/bookings`                 | applicant   | Book a verified advisor (status PENDING)  |
| `GET /api/bookings/mine`             | applicant/advisor | My bookings                         |
| `POST /api/bookings/:id/pay`         | owner       | Simulated payment -> status PAID, records 15% commission |
| `POST /api/applications`             | applicant   | Submit scored plan as application          |
| `GET /api/applications/mine`         | applicant   | My applications (pipeline, repayments)    |
| `GET /api/applications/:id`          | owner/admin | Application detail                         |
| `PATCH /api/applications/:id/status` | **admin**   | Status pipeline (used by the admin review screen) |
| `POST /api/repayments`               | applicant   | Log a repayment (auto-advances pipeline)  |
| `GET /api/repayments/application/:id`| owner/admin | Repayment history + balance summary       |
| `GET /api/products`                  | public      | Marketplace products (all sellers)        |
| `GET /api/products/mine`             | applicant   | My listings                               |
| `POST /api/products`                 | applicant*  | Create listing *(needs Disbursed+)        |
| `PATCH /api/products/:id`            | owner*      | Edit listing                              |
| `DELETE /api/products/:id`           | owner*      | Delete listing                            |
| `GET /api/messages`                  | applicant/advisor | Inbox: my paid conversations + latest message |
| `GET /api/messages/:bookingId`       | participants| Booking chat thread *(needs PAID)*        |
| `POST /api/messages/:bookingId`      | participants| Send a chat message *(needs PAID)*        |
| `GET /api/notifications`             | any auth    | My notifications (newest first)           |
| `GET /api/notifications/unread-count`| any auth    | Unread notification count                 |
| `POST /api/notifications/:id/read`   | owner       | Mark one notification read                |
| `POST /api/notifications/read-all`   | any auth    | Mark all my notifications read            |
| `POST /api/reviews`                  | applicant   | Review a paid booking (one per booking)   |
| `GET /api/reviews/advisor/:advisorId`| public      | Advisor average rating + reviews          |
| `GET /api/advisors/me/clients`       | advisor     | My clients, scores and pipeline           |
| `PATCH /api/business-plans/:id`      | owner/linked advisor/admin | Edit plan (re-scores)        |
| `POST /api/business-plans/:id/advisor`| owner      | Link an advisor to my plan               |
| `DELETE /api/business-plans/:id/advisor`| owner    | Unlink the advisor from my plan          |
| `GET /api/showcase`                  | public      | Success stories (funded, ≥50% repaid)     |
| `GET /api/resources`                 | public      | Resource library (`?category=`)           |
| `GET /api/resources/:id`             | public      | Resource detail                           |
| `GET /api/payments/mine`             | any auth    | Payments I made or earned (simulated)     |
| `GET /api/payments/assessments`      | any auth    | IDs of my plans with a paid assessment    |
| `POST /api/payments/purchase`        | any auth    | Simulated marketplace purchase (8% commission) |
| `POST /api/payments/assessment`      | plan owner  | Simulated K150 plan, risk and market assessment fee |
| `GET /api/admin/revenue`             | **admin**   | Simulated revenue by stream + recent payments |
| `GET /api/admin/summary`             | **admin**   | Dashboard totals, money, stage and category counts |
| `GET /api/admin/applications`        | **admin**   | All applications (`?status=`), newest first |
| `GET /api/admin/advisors`            | **admin**   | All advisors incl. unverified, pending first |
| `PATCH /api/admin/advisors/:id/verify`| **admin**  | Verify / unverify (idempotent)            |
| `POST /api/admin/opportunities`      | **admin**   | Create an opportunity                     |
| `PATCH /api/admin/opportunities/:id` | **admin**   | Edit an opportunity                       |

## Business workflow

How a business owner moves through the platform, and where each party earns or pays.

```
Applicant                     FundPath                          CDF committee, bank, PLGO
---------                     --------                          -------------------------
1. Discover opportunities
2. Build plan + feasibility score
3. (optional) pay K150  ----->  keeps 100% of the fee
4. Book + pay advisor   ----->  keeps 15%, advisor gets 85%
5. Chat with advisor (Messages)
6. Submit application (free) -------------------------------->  7. Ward, CDFC and bank review;
                                                                   PLGO approves
                                                                8. The bank disburses (FundPath
                                                                   never touches this money)
9. Log repayments, see schedule,
   progress bar and reminders
10. List products; buyers pay -->  keeps 8%, seller gets 92%
11. Repaid 50%+ -> Success Stories
```

Roles: the **applicant** plans, applies and repays; the **advisor** coaches (hidden until an
admin verifies them); the **admin** verifies advisors, records the CDF decisions on their behalf
and watches revenue; the **CDF committee, bank and PLGO** are the only decision makers and lenders.

## How CDF works in real life

Source: the draft Constituency Development Fund Guidelines (Ministry of Local Government and Rural
Development, 10 April 2025), issued under the CDF Act No. 1 of 2024. These are draft rules; check
for a final version before quoting exact figures.

1. The applicant gets the loan form (Appendix F) free from the local authority, constituency
   office, council website or a financial institution, and submits it to the **Ward Development
   Committee (WDC)**, signed by the WDC chairperson.
2. The WDC sends its list to the local authority; a **Technical Appraisal Committee** does a desk
   appraisal.
3. The **CDF Committee (CDFC)** verifies applications within 3 working days and shortlists them.
4. A **bank** appraises the shortlist and recommends applicants within the allocated amount.
5. The local authority sends the list to the **Provincial Local Government Officer (PLGO)**, who
   approves or rejects within 7 to 14 working days.
6. The bank gives financial literacy training and **disburses** to the applicants' bank accounts.

Loan terms: 5% simple interest on the total sum; repayment period by loan size (K5,000 to K10,000:
12 months; to K25,000: 18; to K50,000: 24; to K100,000: 30; to K200,000: 36); first instalment 60
days after the loan, then monthly; 10% charge on a late instalment; three missed months ends the
agreement and bars the borrower from the CDF list for 5 years. Equipment bought with the loan is
registered in the local authority's name until the loan is repaid. About 20% of each constituency's
fund goes to youth, women and community empowerment (grants and loans).

The app implements the repayment terms above. It does not model the WDC, CDFC, bank or PLGO as
separate users: the admin records their decisions.

## The business side

FundPath is a service platform, not a lender. Full detail:
[`docs/business-model.md`](./docs/business-model.md).

**The problem.** CDF per constituency rose from K1.6m (2021) to K40m (2026), but by Sept 2026
only about 35% of loans made since 2021 had been repaid and the 2026 loan component was
suspended. Applicants prepare alone, and nobody tracks repayment as one number.

**What FundPath adds.** Better applications before the decision (plan, score, advice) and
repayment support after it (schedule, balance, reminders), with one view for the council.

**Who pays (revenue streams).**

| Stream | Model | Payer | Status in this prototype |
| --- | --- | --- | --- |
| Advisors | 15% commission per paid session (B2B2C) | Applicant, via the advisor's price | Simulated |
| Marketplace | 8% fee on product sales (B2C) | Buyer, taken from the seller's sale | Simulated |
| Plan, risk and market assessment | Flat K150 per plan | Business owner | Simulated |
| Councils | Annual licence for the dashboard and repayment tracking (B2G) | Council, Ministry or donor | Proposal only, not built |

Applying through FundPath is free, and FundPath never handles loan money. The council licence
is the hardest sale: councils buy under the Public Procurement Act and CDF money is meant for
approved projects, so the plan is to pilot in one constituency first, then look at a
Ministry-level or donor-funded deal.

**Honest limits.** The rates (15%, 8%, K150) are assumptions, not agreed terms. Scoring rules
are prototype rules and not validated. There are no real users or real payments yet, and
FundPath cannot force repayment.

## Simulated payments and commission

FundPath has no payment gateway yet. To demonstrate the business model, payments are
**simulated**: every "paid" action writes a row to the `transactions` table recording the gross
amount, the commission rate, FundPath's commission and the net amount to the payee.

| Stream                         | Trigger                                   | Paid by        | FundPath commission |
| ------------------------------ | ----------------------------------------- | -------------- | ------------------- |
| Advisor session                | "Pay (simulated)" on a booking            | Applicant      | 15%                 |
| Marketplace sale               | "Buy now (simulated)" on a product        | Any signed-in user | 8%              |
| Plan, risk & market assessment | "Pay K150 (simulated)" on a business plan | Business owner | 100% (flat K150)    |

The rates live in `server/src/modules/payments/fees.ts` and are **illustrative assumptions**,
not agreed commercial terms. Admins see totals and recent payments under **Admin → Revenue**.
Applying through FundPath is free, and FundPath never handles loan money.

> Moving to real revenue means replacing the simulated "pay" actions with a mobile-money
> integration; the ledger and revenue view stay the same.

## Advisor onboarding

New advisors register, then land on the profile form. Until an admin verifies the profile
(**Admin → Advisors**), the advisor is hidden from the public advisor list and sees a
"waiting for verification" banner on their dashboard.

## Feasibility scoring rules (0–100)

Rules-based, not ML — three factors:

1. **Cost-to-revenue ratio (40%)** — projected revenue ÷ startup costs.
2. **Requested amount vs pool (40%)** — compared against the opportunity's `amountAvailable`.
3. **Completeness (20%)** — all fields filled meaningfully, non-blank.

Category: `High ≥ 70`, `Medium ≥ 45`, else `Low`. The engine emits 1–2 sentences of
recommendations, stored on the `FeasibilityScore` row and shown to the applicant.

## Status pipeline

```
Submitted -> Under Review -> Approved -> Disbursed -> Repaying -> Closed
                                   ↘ Rejected (terminal)
```

- Transition validation lives in `server/src/modules/applications/applicationFlow.ts`.
- The CDF committee, a bank and the PLGO make the decisions; an administrator records them here (there is no committee, bank or PLGO login yet).
- Setting an application to **Disbursed** records the amount that was paid out (`amountDisbursed`, admin endpoint).
- Logging a repayment auto-advances Disbursed → Repaying, and closes the loan when fully repaid.

## Deploying to Render (backend + frontend)

Uses the included [`render.yaml`](./render.yaml) blueprint. The API runs as a Render **Web
Service** and the frontend as a **Static Site**; the database stays on Neon. No Docker, no
Procfile — just the blueprint and a few env vars.

### Steps

1. **Push this repo to GitHub** (it's already at `github.com/mwemmz/cdf-project`).
2. In Render: **New + → Blueprint** → connect the repo → **branch `master`**.
   Render will create `fundpath-api` and `fundpath-web` from `render.yaml` (the first deploy
   may fail on missing env vars — set them and redeploy below).
3. **Create the Neon database** (free tier is fine) and copy its pooled/unpooled connection
   string: `postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require`.
4. Open **fundpath-api** → **Environment** and set:
   - `DATABASE_URL` → your Neon connection string
   - `CLIENT_URL` → `https://fundpath-web.onrender.com`
   - `JWT_SECRET` is auto-generated by the blueprint (change it if you like)
   Then **Manual Deploy → Deploy latest commit**. The **build step applies pending
   migrations** (via `prisma migrate deploy`) and the **initial-deploy hook runs the seed**
   (`pnpm seed`) once after the first successful deploy — creating the test accounts,
   opportunities and demo data.
5. Open **fundpath-web** → **Environment** and set:
   - `VITE_API_BASE` → `https://fundpath-api.onrender.com/api`
   Then **Manual Deploy → Deploy latest commit**. This bakes the API base URL into the bundle.

### Notes & gotchas

- **Free plan spins down idle services.** After ~15 minutes of inactivity the API goes to
  sleep; the first request can take ~1 minute to respond. A paid `starter` plan avoids this.
- **The seed only runs on the first deploy** (Render's `initialDeployHook`). If you need to
  re-seed a database that already has data, run `pnpm seed` manually from your machine
  against your Neon URL — note the script **wipes existing data** first.
- **Refresh/deep links work** because the static site rewrites all paths to `/index.html`.
- Render's node runtime defaults to Node 22; installs use the repo-root `pnpm-lock.yaml`
  (don't commit per-package lockfiles).
- The blueprint skips **health checks** (paid-plan feature); `/health` still exists for
  manual checks.

## Tests

Server tests (node:test + supertest) drive the Express app over HTTP against a separate Postgres
database. Point `server/.env.test` at an empty database, then run `pnpm test` from the repo root;
it applies migrations and runs `server/src/test/**/*.test.ts`. There is no client test harness —
the admin UI is checked manually with the seeded admin account.
