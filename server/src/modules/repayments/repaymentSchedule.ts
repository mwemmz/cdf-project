const TERM_MONTHS = 12;
const DAYS_PER_MONTH = 30.44;

export interface RepaymentSchedule {
  termMonths: number;
  monthlyPayment: number;
  monthsElapsed: number;
  expectedToDate: number;
  expectedPercentage: number;
  onTrack: boolean;
  dueDate: string | null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Simple straight-line schedule: total disbursed / 12 months.
export function computeRepaymentSchedule(
  totalDisbursed: number,
  totalRepaid: number,
  disbursedAt: Date | null,
  repaymentDueDate: Date | null,
  now: Date = new Date(),
): RepaymentSchedule | null {
  if (!disbursedAt || totalDisbursed <= 0) return null;

  const monthlyPayment = totalDisbursed / TERM_MONTHS;
  const elapsedMs = Math.max(0, now.getTime() - disbursedAt.getTime());
  const rawMonths = elapsedMs / (DAYS_PER_MONTH * 24 * 60 * 60 * 1000);
  const monthsElapsed = Math.min(TERM_MONTHS, Math.round(rawMonths * 100) / 100);
  const expectedToDate = Math.min(totalDisbursed, monthlyPayment * monthsElapsed);

  return {
    termMonths: TERM_MONTHS,
    monthlyPayment: round2(monthlyPayment),
    monthsElapsed,
    expectedToDate: round2(expectedToDate),
    expectedPercentage: round2((expectedToDate / totalDisbursed) * 100),
    onTrack: totalRepaid + 1 >= expectedToDate,
    dueDate: repaymentDueDate ? repaymentDueDate.toISOString() : null,
  };
}