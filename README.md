# FundPath — CDF Loan-to-Repayment Platform

FundPath helps Zambian applicants apply for Constituency Development Fund (CDF) opportunities:
build and score a business plan, book sessions with verified advisors, track a loan through
disbursement and repayment, and sell products on a storefront once funded.

Delivered as one cohesive full-stack slice covering two developers' scope:

- **Dev 1 — core backend & data layer:** Prisma schema, migrations, seeding, auth (JWT + bcrypt,
  role-based access), opportunities, business plan builder, rules-based feasibility scoring.
- **Dev 2 — marketplace & transactions:** advisor marketplace & bookings, applications/loan
  tracking, repayments, and the public storefront.

Admin dashboard, review/approval UI, analytics/charts, and deployment config are intentionally
**out of scope** (built by a separate Admin/Analytics developer on top of these endpoints).

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
│                           # advisors, bookings, applications, repayments, products
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

## Seeded test accounts

| Role      | Email                   | Password       |
| --------- | ----------------------- | -------------- |
| Admin     | admin@fundpath.zm       | Admin@123      |
| Advisor 1 | advisor1@fundpath.zm    | Advisor@123    |
| Advisor 2 | advisor2@fundpath.zm    | Advisor@123    |
| Applicant | applicant@fundpath.zm   | Applicant@123  |

The seed also creates 6 CDF opportunities, two **verified** advisor profiles (so the marketplace
is testable — real verification is the Admin developer's job), a demo applicant whose application
is already **Disbursed** with two repayments and two storefront products, and one paid booking.

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
| `POST /api/bookings/:id/pay`         | owner       | Mock payment -> status PAID               |
| `POST /api/applications`             | applicant   | Submit scored plan as application          |
| `GET /api/applications/mine`         | applicant   | My applications (pipeline, repayments)    |
| `GET /api/applications/:id`          | owner/admin | Application detail                         |
| `PATCH /api/applications/:id/status` | **admin**   | Status pipeline (Admin team hooks in here) |
| `POST /api/repayments`               | applicant   | Log a repayment (auto-advances pipeline)  |
| `GET /api/repayments/application/:id`| owner/admin | Repayment history + balance summary       |
| `GET /api/products`                  | public      | Marketplace products (all sellers)        |
| `GET /api/products/mine`             | applicant   | My listings                               |
| `POST /api/products`                 | applicant*  | Create listing *(needs Disbursed+)        |
| `PATCH /api/products/:id`            | owner*      | Edit listing                              |
| `DELETE /api/products/:id`           | owner*      | Delete listing                            |

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
- Setting an application to **Disbursed** stores `amountDisbursed` (admin endpoint).
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
   Then **Manual Deploy → Deploy latest commit**. The **pre-deploy step runs
   `prisma migrate deploy`**, so tables are created on Neon automatically, and the
   **initial-deploy hook runs the seed** (`pnpm seed`) once after the first successful
   deploy — creating the test accounts, opportunities and demo data.
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

## Notes for the Admin/Analytics developer

- Reuse the `{ success, data | error }` envelope and the endpoints above.
- Admin actions (review/approve applications, verify advisors, manage opportunities) plug into the
  existing `PATCH /api/applications/:id/status` and the `verified` / role fields.
- Charts/analytics have no dependencies in this slice and consume the same payloads.