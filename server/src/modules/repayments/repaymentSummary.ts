import { ApplicationStatus } from '@prisma/client';
import { totalDueFor, interestFor } from './loanTerms';

export interface RepaymentSummary {
  totalDisbursed: number;
  interest: number;
  totalDue: number;
  totalRepaid: number;
  remainingBalance: number;
  repaymentPercentage: number;
}

// Balance and progress are measured against the total due: principal plus the
// 5% simple interest the CDF guidelines set for empowerment loans.
export function computeRepaymentSummary(totalDisbursed: number, totalRepaid: number): RepaymentSummary {
  const totalDue = totalDueFor(totalDisbursed);
  const remainingBalance = Math.max(0, Math.round((totalDue - totalRepaid) * 100) / 100);
  const repaymentPercentage = totalDue > 0 ? (totalRepaid / totalDue) * 100 : 0;
  return {
    totalDisbursed,
    interest: interestFor(totalDisbursed),
    totalDue,
    totalRepaid,
    remainingBalance,
    repaymentPercentage: Math.round(repaymentPercentage * 100) / 100,
  };
}

export function isRepaymentEligible(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.DISBURSED || status === ApplicationStatus.REPAYING;
}
