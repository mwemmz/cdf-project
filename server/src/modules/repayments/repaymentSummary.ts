import { ApplicationStatus } from '@prisma/client';

export interface RepaymentSummary {
  totalDisbursed: number;
  totalRepaid: number;
  remainingBalance: number;
  repaymentPercentage: number;
}

export function computeRepaymentSummary(totalDisbursed: number, totalRepaid: number): RepaymentSummary {
  const remainingBalance = Math.max(0, totalDisbursed - totalRepaid);
  const repaymentPercentage = totalDisbursed > 0 ? (totalRepaid / totalDisbursed) * 100 : 0;
  return {
    totalDisbursed,
    totalRepaid,
    remainingBalance,
    repaymentPercentage: Math.round(repaymentPercentage * 100) / 100,
  };
}

export function isRepaymentEligible(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.DISBURSED || status === ApplicationStatus.REPAYING;
}