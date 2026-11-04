// CDF empowerment loan terms, from the draft Constituency Development Fund
// Guidelines (Ministry of Local Government and Rural Development, 10 Apr 2025):
//  - loans attract simple interest of 5% of the total sum (s.5.3.2)
//  - repayment period depends on the amount (Table 3)
//  - first instalment 60 days after the loan, then monthly (Appendix H)
//  - a late instalment attracts a 10% charge (shown to the borrower; not applied here)
// These are draft rules: confirm against the final guidelines before relying on them.

export const INTEREST_RATE = 0.05;
export const FIRST_PAYMENT_DAYS = 60;
export const LATE_CHARGE_RATE = 0.1;

const TIERS: { max: number; months: number }[] = [
  { max: 10_000, months: 12 },
  { max: 25_000, months: 18 },
  { max: 50_000, months: 24 },
  { max: 100_000, months: 30 },
  { max: 200_000, months: 36 },
];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function termMonthsFor(principal: number): number {
  const tier = TIERS.find((t) => principal <= t.max);
  return tier ? tier.months : TIERS[TIERS.length - 1].months;
}

export function interestFor(principal: number): number {
  return round2(principal * INTEREST_RATE);
}

export function totalDueFor(principal: number): number {
  return round2(principal + interestFor(principal));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

// Due date of instalment number k (1-based).
export function instalmentDueDate(disbursedAt: Date, k: number): Date {
  return addMonths(addDays(disbursedAt, FIRST_PAYMENT_DAYS), k - 1);
}

export function finalDueDate(disbursedAt: Date, principal: number): Date {
  return instalmentDueDate(disbursedAt, termMonthsFor(principal));
}
