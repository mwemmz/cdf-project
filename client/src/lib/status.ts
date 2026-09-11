export const APPLICATION_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
  REPAYING: 'Repaying',
  CLOSED: 'Closed',
};

export const APPLICATION_COLORS: Record<string, string> = {
  SUBMITTED: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-700',
  DISBURSED: 'bg-blue-100 text-blue-800',
  REPAYING: 'bg-violet-100 text-violet-800',
  CLOSED: 'bg-slate-700 text-white',
};

export const BOOKING_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export const BOOKING_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export const SPECIALTY_LABELS: Record<string, string> = {
  business_plans: 'Business Plans',
  feasibility: 'Feasibility',
  accounting: 'Accounting',
};

export const FEASIBILITY_COLORS: Record<string, string> = {
  High: 'bg-emerald-100 text-emerald-800',
  Medium: 'bg-amber-100 text-amber-800',
  Low: 'bg-rose-100 text-rose-700',
};