import { ApplicationStatus } from '@prisma/client';

// Allowed transitions for the loan pipeline. Empty list = terminal state.
export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: [ApplicationStatus.UNDER_REVIEW],
  UNDER_REVIEW: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
  APPROVED: [ApplicationStatus.REJECTED, ApplicationStatus.DISBURSED],
  REJECTED: [],
  DISBURSED: [ApplicationStatus.REPAYING],
  REPAYING: [ApplicationStatus.CLOSED],
  CLOSED: [],
};

export function assertTransition(from: ApplicationStatus, to: ApplicationStatus) {
  if (from === to) return;
  if (!APPLICATION_TRANSITIONS[from]?.includes(to)) {
    throw new Error(`Invalid status transition: ${from} -> ${to}`);
  }
}

export function isDisbursedOrLater(status: ApplicationStatus): boolean {
  return (
    status === ApplicationStatus.DISBURSED ||
    status === ApplicationStatus.REPAYING ||
    status === ApplicationStatus.CLOSED
  );
}