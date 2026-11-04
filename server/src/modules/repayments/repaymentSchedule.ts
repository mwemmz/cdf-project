import {
  INTEREST_RATE,
  LATE_CHARGE_RATE,
  finalDueDate,
  instalmentDueDate,
  interestFor,
  termMonthsFor,
  totalDueFor,
} from './loanTerms';

export interface RepaymentSchedule {
  termMonths: number;
  interestRate: number;
  interest: number;
  totalDue: number;
  monthlyPayment: number;
  lateChargeRate: number;
  installmentsDue: number;
  nextDueDate: string | null;
  expectedToDate: number;
  expectedPercentage: number;
  onTrack: boolean;
  dueDate: string | null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Schedule from the CDF guideline terms: term by loan size, 5% simple interest,
// first instalment 60 days after disbursement, then monthly.
export function computeRepaymentSchedule(
  totalDisbursed: number,
  totalRepaid: number,
  disbursedAt: Date | null,
  now: Date = new Date(),
): RepaymentSchedule | null {
  if (!disbursedAt || totalDisbursed <= 0) return null;

  const termMonths = termMonthsFor(totalDisbursed);
  const totalDue = totalDueFor(totalDisbursed);
  const monthlyPayment = totalDue / termMonths;

  let installmentsDue = 0;
  while (installmentsDue < termMonths && instalmentDueDate(disbursedAt, installmentsDue + 1) <= now) {
    installmentsDue += 1;
  }

  const expectedToDate = Math.min(totalDue, monthlyPayment * installmentsDue);
  const next =
    installmentsDue < termMonths ? instalmentDueDate(disbursedAt, installmentsDue + 1).toISOString() : null;

  return {
    termMonths,
    interestRate: INTEREST_RATE,
    interest: interestFor(totalDisbursed),
    totalDue,
    monthlyPayment: round2(monthlyPayment),
    lateChargeRate: LATE_CHARGE_RATE,
    installmentsDue,
    nextDueDate: next,
    expectedToDate: round2(expectedToDate),
    expectedPercentage: round2((expectedToDate / totalDue) * 100),
    onTrack: totalRepaid + 1 >= expectedToDate,
    dueDate: finalDueDate(disbursedAt, totalDisbursed).toISOString(),
  };
}
