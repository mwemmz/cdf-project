# Spec: Admin & Analytics Dashboard (Dev 3)

**Owner:** Dev 3 · **Status:** ready for agent · **Repo:** mwemmz/cdf-project

## Problem Statement

FundPath has a working loan pipeline and a seeded `ADMIN` account, but no way for an
administrator to actually administer anything. The only way to review an application,
move it through the pipeline, or verify an advisor today is to call the API by hand or
edit the database directly, because no admin interface exists and no admin endpoint
exposes the data an administrator needs to see.

Three gaps make this concrete:

- **An administrator cannot list applications.** The only listing endpoint returns the
  caller's own applications, so an administrator sees an empty list. There is no way to
  see what is waiting to be reviewed.
- **An advisor who registers is invisible, permanently.** Registration creates an advisor
  profile as unverified, and the only advisor listing filters to verified profiles. So a
  newly registered advisor appears in no list anywhere, and nothing in the product can
  ever verify them. The seeded advisors are verified by hand precisely to work around
  this.
- **There is no view of the platform as a whole.** Nobody can answer "how many
  applications are waiting", "how much has been disbursed and repaid", or "how much is
  still outstanding" without querying the database.

The consequence is that the loan pipeline cannot actually be operated by the people it
was built for, and the advisor marketplace only ever contains the accounts the seed
script planted.

## Solution

An **admin area** in the client, reachable only by accounts with the `ADMIN` role, backed
by a small set of **admin-only API endpoints**. It gives an administrator:

- a **dashboard** summarising the platform: application counts by pipeline stage, money
  requested / disbursed / repaid / outstanding, advisors awaiting verification, and
  opportunity coverage
- a **review queue** listing every application across every applicant, filterable by
  pipeline stage, from which an application can be opened and moved through the pipeline
- an **advisor verification queue** listing advisors including unverified ones, with the
  ability to verify and unverify
- **opportunity management**: create and edit CDF opportunities

Review actions reuse the existing admin-gated status transition endpoint rather than
duplicating it. Applicants and advisors never see the admin area, are not offered admin
navigation, and are refused if they navigate to an admin URL directly.

## User Stories

### Access and role gating

1. As an administrator, I want to sign in with my admin account, so that I land in the
   admin area instead of an applicant or advisor page.
2. As an administrator, I want the admin area to be reachable only by admin accounts, so
   that applicants and advisors cannot read or change review data.
3. As an applicant or advisor, I want a clear message that a page is not available to my
   account type, so that I understand why I cannot see it.
4. As an applicant or advisor, I want to be refused when I type an admin URL directly, so
   that access does not depend on hiding navigation links.
5. As an administrator, I want admin navigation to appear only for me, so that the
   interface never offers me actions I cannot take.
6. As an administrator, I want my account name and role displayed, so that I can confirm
   which account I am acting as.
7. As a signed-out visitor, I want to be sent to the sign-in page when I open an admin URL,
   so that I do not see a broken or half-empty page.
8. As an administrator, I want my admin session to survive a page refresh, so that I do not
   have to sign in again mid-review.

### Dashboard

9. As an administrator, I want to see how many applications sit at each pipeline stage, so
   that I know where the backlog is.
10. As an administrator, I want to see the total amount requested across all applications,
    so that I understand the demand on the fund.
11. As an administrator, I want to see the total amount disbursed, so that I know how much
    capital has left the fund.
12. As an administrator, I want to see the total amount repaid, so that I know how much has
    come back.
13. As an administrator, I want to see the outstanding balance across all live loans, so
    that I know the fund's exposure.
14. As an administrator, I want to see the number of advisors awaiting verification, so that
    I know there is work in that queue.
15. As an administrator, I want to see the number of opportunities on the platform, so that
    I know how many funding windows are open.
16. As an administrator, I want the dashboard to be the page I land on after signing in, so
    that I see platform state before I start reviewing.
17. As an administrator, I want the dashboard figures recomputed from the database on every
    load, so that I am never shown stale numbers.
18. As an administrator, I want the headline figures presented as summary cards, so that I
    can read platform state at a glance.
19. As an administrator, I want items that are waiting on me surfaced as counts I can act
    on, so that the dashboard tells me what to do next, not just what happened.
20. As an administrator, I want each summary figure to be derived from real stored data, so
    that I can trust it in a demo.

### Application review

21. As an administrator, I want to see every application on one list, so that I can review
    the whole pipeline without querying per applicant.
22. As an administrator, I want each list row to show the applicant, the opportunity, the
    amount requested, the amount disbursed, the current stage, and the submission date, so
    that I can triage without opening each one.
23. As an administrator, I want to filter the list by pipeline stage, so that I can work one
    queue at a time.
24. As an administrator, I want the list ordered most recent first, so that new submissions
    are at the top.
25. As an administrator, I want to open a single application, so that I can review it in
    full before deciding.
26. As an administrator, I want the detail view to show the applicant's business plan,
    including idea, target market, startup costs, revenue projection, and amount requested,
    so that I can judge the request on its merits.
27. As an administrator, I want to see the feasibility score, its category, and its written
    recommendations, so that the automated assessment informs my decision.
28. As an administrator, I want to see the repayment history and remaining balance for a
    loan already disbursed, so that I can see whether it is being serviced.
29. As an administrator, I want to see the application's position in the pipeline visually,
    so that I understand where it sits without reading the status string.
30. As an administrator, I want to be offered only the transitions legal from the current
    stage, so that I cannot choose an invalid next step.
31. As an administrator, I want to move a submitted application to under review, so that the
    applicant sees it has been picked up.
32. As an administrator, I want to approve an application under review, so that it becomes
    eligible for disbursement.
33. As an administrator, I want to reject an application under review, so that an unviable
    request is closed off.
34. As an administrator, I want rejection to be terminal, so that a rejected application
    cannot be silently revived.
35. As an administrator, I want to record an amount disbursed when moving an application to
    disbursed, defaulting to the requested amount, so that the fund's exposure is accurate.
36. As an administrator, I want to be prevented from disbursing a non-positive amount, so
    that a zero or negative loan cannot be recorded.
37. As an administrator, I want to move a disbursed application into repayment, so that it
    appears as a live loan.
38. As an administrator, I want to be told clearly when a transition is not allowed, so that
    a rejected action explains itself instead of failing silently.
39. As an administrator, I want the screen to reflect the new stage after an action without a
    manual browser reload, so that reviewing a queue stays fast.
40. As an administrator, I want my status change to persist, so that the applicant's own
    tracker and any later admin session show the same stage.
41. As an administrator, I want the applicant to remain able to view their own application
    detail after my change, so that the existing applicant flow is not broken.

### Advisor verification

42. As an administrator, I want a queue of advisors awaiting verification, so that I have one
    place to work through.
43. As an administrator, I want a list of all advisors including unverified ones, so that no
    registered advisor is invisible to me.
44. As an administrator, I want each advisor row to show name, email, specialty, session
    price, verification state, and registration date, so that I can judge readiness.
45. As an administrator, I want to see how many advisors are pending, so that I know the size
    of the queue before opening it.
46. As an administrator, I want to verify an advisor, so that they become bookable.
47. As an administrator, I want a newly verified advisor to appear in the public advisor
    marketplace, so that the verification has a visible effect.
48. As an administrator, I want to unverify an advisor, so that a profile that should not be
    public is withdrawn.
49. As an administrator, I want an unverified advisor to disappear from the public
    marketplace, so that the withdrawal is effective.
50. As an administrator, I want unverified advisors to be visible to me while remaining
    hidden from applicants, so that reviewing a profile does not make it public.
51. As an administrator, I want a newly registered advisor to appear in my queue, so that the
    registration flow leads somewhere rather than into a dead end.
52. As an administrator, I want either action to be safe to repeat, so that a double click
    does not corrupt the profile.

### Opportunity management

53. As an administrator, I want to see all opportunities with their constituency, category,
    amount available, and deadline, so that I can see what is open.
54. As an administrator, I want to create an opportunity, so that a new funding window can be
    opened without a developer or a database edit.
55. As an administrator, I want to edit an existing opportunity, so that a pool amount or a
    deadline can be corrected.
56. As an administrator, I want to be prevented from saving an opportunity with a missing
    constituency or category, so that malformed records cannot be created.
57. As an administrator, I want to be prevented from setting a negative amount available, so
    that a nonsensical pool cannot be published.
58. As an administrator, I want opportunities ordered by deadline, so that the most urgent
    funding window is first.
59. As an applicant, I want a newly created opportunity to appear on the public opportunities
    list, so that opportunity management has a visible effect.

### Analytics

60. As an administrator, I want a chart of application counts by pipeline stage, so that the
    shape of the pipeline is visible rather than only tabular.
61. As an administrator, I want a chart of disbursed versus repaid amounts, so that the flow
    of money is legible.
62. As an administrator, I want to see the distribution of feasibility categories across
    plans, so that I can see the quality of what is being submitted.
63. As an administrator, I want to see which constituencies or opportunities attract the most
    applications, so that demand can be compared against the fund's allocation.
64. As an administrator, I want the charts to render without depending on an external service
    at page load, so that the dashboard works even when the machine is offline.

### Guardrails and non-regression

65. As an applicant, I want my own pages and navigation to behave exactly as before, so that
    the admin work does not disturb my application flow.
66. As an advisor, I want my own pages and navigation to behave exactly as before, so that
    the admin work does not disturb my profile and bookings.
67. As a developer, I want every admin endpoint to reject a non-admin token, so that review
    data is never exposed to another role.
68. As a developer, I want every admin endpoint to reject a missing token, so that the
    authorization rule is enforced in one place rather than per endpoint.
69. As a developer, I want admin responses to use the same response envelope as the rest of
    the API, so that the client needs no special-case parsing.
70. As a developer, I want the existing public advisor listing to keep returning verified
    advisors only, so that the admin fix does not leak unverified profiles publicly.

## Implementation Decisions

### Reuse before build

1. Status transitions reuse the **existing admin-gated status endpoint**
   (`PATCH /api/applications/:id/status`) rather than adding a second write path. It is
   already restricted to the admin role and already enforces the legal transition table.
2. Application detail for an administrator reuses the **existing application detail
   endpoint** (`GET /api/applications/:id`), which already grants access to the owner or an
   admin.
3. Business plan detail and feasibility recomputation already permit an admin and are reused
   for the review screen's plan panel.
4. Repayment history already permits an admin and is reused for the loan/servicing panel.
5. **No Prisma schema change is required.** The `Role` enum, `AdvisorProfile.verified`,
   the `ApplicationStatus` pipeline, the `Opportunity` fields, and `Repayment.date` already
   cover every requirement in this spec. If implementation finds itself needing a migration,
   that is a signal to re-check this spec rather than to change the schema.
6. The **public advisor listing keeps its verified-only filter**. The fix for the invisible
   advisor is an admin-scoped listing, not a loosening of the public contract. Applicants
   must never see unverified profiles.

### Admin API surface

7. A new **admin module** is mounted under a single `/api/admin` prefix and guarded **once**
   at the router level with the existing authentication and role middleware, so the admin
   rule is expressed in exactly one place rather than repeated per endpoint. Per-route role
   checks are deliberately avoided.
8. Admin responses use the **existing response envelope** (`{ success, data }`), so the
   client needs no special-case parsing and the existing API helper works unchanged.

### API contracts

9. `GET /api/admin/summary` returns a single aggregate payload covering the whole dashboard:
   application totals and a count per pipeline stage; money as requested, disbursed, repaid,
   and outstanding; advisor totals split verified and pending; opportunity total; and the
   distribution of feasibility categories. One request, one interface, many behaviours.
10. Outstanding balance is computed as the sum per application of disbursed minus repaid,
    floored at zero, **reusing the existing repayment summary module** so that the admin
    figure and the applicant's own balance can never disagree.
11. `GET /api/admin/applications` lists every application across all applicants with the
    applicant, opportunity, requested amount, disbursed amount, status, and creation date,
    ordered most recent first, with optional filters for status and opportunity and optional
    limit/offset.
12. An unrecognised status filter is rejected as a validation error rather than silently
    returning everything.
13. `GET /api/admin/advisors` lists all advisor profiles **including unverified ones**, with
    the profile fields and the owning user's name, email, and registration date, with an
    optional filter for verification state, and ordered so that advisors awaiting
    verification come first.
14. `PATCH /api/admin/advisors/:id/verification` takes a required boolean and sets the
    profile's verification state, returning the updated profile. It is idempotent, so
    repeating the same action is harmless. An unknown profile identifier is a not-found
    response.
15. `POST /api/admin/opportunities` and `PATCH /api/admin/opportunities/:id` create and edit
    opportunities. Both accept constituency name, category, amount available, and deadline;
    both validate with the project's existing schema-validation approach; blank constituency
    or category, a negative amount, and an unparseable deadline are rejected as validation
    errors; creation answers with a created status.
16. Status codes follow the project's existing conventions: unauthenticated is 401, a
    non-admin token is 403, an unknown resource is 404, and invalid input is 400 with the
    existing `details` array.

### Client

17. Admin pages live under a single `/admin` route group wrapped in **one** existing
    role-gating guard configured for the admin role, so the client-side rule is stated once
    and every admin page inherits it. The guard already renders a "not available to your
    account type" message for a wrong role and redirects an unauthenticated visitor to
    sign-in, so both behaviours come for free.
18. A nested admin layout supplies admin sub-navigation (dashboard, applications, advisors,
    opportunities) so the main layout stays about the public site and the applicant and
    advisor flows.
19. The main layout gains an **admin branch** mirroring the existing applicant and advisor
    branches, in both the desktop navigation and the mobile drawer, so admin links appear
    only for admins.
20. Money formatting and status presentation reuse the **existing shared helpers** rather
    than introducing admin-specific ones, so the same amount and the same stage read
    identically on the applicant's tracker and the admin's review screen.
21. The transition buttons are derived from the **existing transition table** exposed to the
    client as data, but the server remains the authority: it already rejects an illegal
    transition, and the client must surface that message rather than assume its own list is
    complete.
22. Charts are rendered as **inline SVG and CSS bars**, adding no charting dependency. This
    also satisfies the requirement that charts do not depend on an external service at page
    load.
23. The seed is extended with **one unverified advisor profile** so the verification queue is
    never empty in development or a demonstration. The existing verified advisors are left
    in place.
24. Admin pages are added to the client as new pages; no applicant or advisor page is
    rewritten, keeping the diff scoped to the admin feature.

## Testing Decisions

### What makes a good test here

- A test asserts **external behaviour across the HTTP seam**: the status code and the values
  in the response body. It must not reach into the database to assert internal state and
  must not couple to controller internals, so the implementation behind an endpoint can be
  rewritten without touching the tests.
- Tests drive the application through its **exported application factory**, not a running
  server, so no port is bound and the suite runs unattended in a terminal or CI.
- Expected values come from a **known fixture**, not from recomputing the way the code
  computes. The summary fixture is small enough that its totals can be written as literals,
  which is the only way to catch a subtly wrong aggregate.
- An assertion must be able to fail. Any test that passes against the base commit before any
  work is done is verifying nothing and should be rewritten.

### The seam

**One seam: the HTTP API.** It is the highest seam available, it exists today, and it needs
no production-code change to expose.

- The application factory is already exported, so the seam is already there: a test imports
  it and drives requests through it. Preferring this existing seam over a new one is the
  whole reason it is the choice.
- Every endpoint this spec adds or reuses is reachable through that one seam, so one seam
  covers the entire feature rather than one seam per module.
- Existing endpoints that are reused (the status transition, application detail, business
  plan detail, repayment history) are covered by the same seam, so their admin behaviour is
  asserted alongside the new endpoints instead of being taken on trust.

### New test tooling

The repository has **no test framework**: no runner configuration, no test files, and no test
dependency in either package. This spec introduces the first suite.

- A test runner and an HTTP assertion library are added to the server package as
  development dependencies (vitest and supertest).
- A single documented command runs the suite from the repo root, matching how the existing
  scripts are exposed.
- Tests run against an **isolated test database** (a separate Postgres database from the
  development one), with migrations applied before the run and data reset between tests, so
  a test run never touches development or seeded data.
- Test-only dependencies are confined to the server package. No test tooling is added to the
  client.

### What the suite covers

**The authorization matrix, for every admin endpoint.** This is the security boundary of the
feature, so it is asserted rather than assumed: no token answers 401; an applicant token
answers 403; an advisor token answers 403; an admin token succeeds. Applied at minimum to the
summary, the application list, the advisor list, the verification endpoint, and opportunity
creation.

**The advisor visibility regression.** The highest-value test in this spec, because it pins
the bug this feature exists to fix:

- given an unverified advisor profile, the admin listing **includes** it and the public
  advisor listing **excludes** it
- after verifying through the admin endpoint, the public listing **includes** it
- after unverifying, the public listing **excludes** it again
- repeating a verification call leaves the state unchanged

**Application listing.** Returns applications belonging to more than one applicant, proving
the list is not silently scoped to the caller; a status filter narrows the result to that
stage; an unknown status value is rejected rather than ignoring the filter.

**Status transitions.** An illegal transition is rejected; moving to disbursed with a
non-positive amount is rejected; a legal transition persists, so a later read of the same
application reports the new stage.

**Opportunity validation and visibility.** A blank constituency, a negative amount, and an
unparseable deadline are each rejected; a valid creation then appears on the public
opportunities listing.

**Summary aggregates.** Computed against a fixture with known amounts and asserted as
literals, including the floor-at-zero case where repayments exceed the amount disbursed.

### Prior art

**None.** This is the first automated test suite in the repository, so there is no in-repo
test to imitate. The conventions to honour are the ones the codebase already establishes
instead: the `{ success, data }` and `{ success, error, details }` envelope, bearer-token
authentication, the seeded fixture accounts, and validation failures surfacing as a 400 with
a `details` array.

### No client test harness

No client test framework is introduced. The admin interface is verified manually against the
running API using the seeded admin account.

The one client behaviour worth automating is role gating, and it is already covered
indirectly: the guard is pre-existing and unchanged, and its server-side counterpart is
covered by the authorization matrix above. Adding a component-rendering harness would mean a
second seam and a second toolchain for a three-developer project, which this spec
deliberately avoids.

## Out of Scope

- **Creating, promoting, or inviting admin accounts.** Registration deliberately excludes the
  admin role, so the seeded admin account remains the only way to obtain one. Building an
  admin-provisioning flow would mean changing a deliberate security restriction and is
  excluded from this work.
- **User management.** Editing, deactivating, or deleting users; password reset; changing
  another account's password or role.
- **An audit trail.** The application record has no updated-at field, so a status change is
  neither timestamped nor attributed. Adding one is a schema migration, and this spec
  deliberately includes no schema change.
- **Reversing a decision beyond the legal transitions.** No un-reject, no un-disburse, and no
  free-text note or reviewer comment attached to a review.
- **Notifying applicants** by email or in-app when their status changes.
- **Deleting** applications, opportunities, or advisor profiles.
- **Exporting** reports to CSV or PDF.
- **Real payment processing and file uploads.**
- **Reworking the applicant, advisor, or public marketplace surfaces**, beyond the single
  admin navigation branch and the admin-scoped advisor listing.
- **Render and Neon deployment changes.** The deployment blueprint already exists in the
  repository; verifying it end to end on the host is tracked separately and is not part of
  this spec.
- **Granular admin permissions or multiple admin tiers.** There is one admin role carrying
  every admin power.
- **Any change to the Prisma schema.**

## Further Notes

- **The single highest-value fix in this spec is advisor visibility.** An advisor who
  registers today is invisible permanently: registration stores the profile as unverified,
  and the only listing filters to verified profiles. The verification queue is not a
  nice-to-have; it is the missing half of a flow that already exists on the advisor's side.
  Until it ships, a real advisor can never reach the marketplace.
- The status-transition endpoint was left admin-gated with a comment anticipating exactly
  this work, and the repository README closes with a note addressed to the admin developer.
  Both point at the same intended design: **reuse the write path, add the reads.**
- **No migration is expected.** An unexpected need for one is a defect in this spec worth
  reporting rather than a step to take.
- The seeded admin account is `admin@fundpath.zm` / `Admin@123`.
- Money is stored as a float in Kwacha, matching the rest of the project.
- This spec is also kept as a file in the repository so the ticket breakdown and the code
  review can read it locally instead of re-fetching it from the issue tracker, which is the
  documented failure mode for large specifications.
- The issue tracker for this repository is GitHub. This spec is intended to be published
  there as an issue carrying the `ready-for-agent` label, which is deferred until the `gh`
  command line is authenticated on the development machine.
- Two things this work must not regress: applicants still see only their own applications,
  and the public advisor marketplace still shows only verified advisors.





