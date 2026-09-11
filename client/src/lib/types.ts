export type Role = 'APPLICANT' | 'ADVISOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  advisorProfile?: AdvisorProfile | null;
}

export interface AdvisorProfile {
  id: string;
  userId: string;
  specialty: string;
  bio: string;
  pricePerSession: number;
  verified: boolean;
  user?: Pick<User, 'id' | 'name' | 'email' | 'createdAt'>;
}

export interface Opportunity {
  id: string;
  constituencyName: string;
  category: string;
  amountAvailable: number;
  deadline: string;
}

export interface FeasibilityScore {
  id: string;
  businessPlanId: string;
  score: number;
  category: 'Low' | 'Medium' | 'High';
  recommendations: string;
}

export interface BusinessPlan {
  id: string;
  applicantId: string;
  opportunityId: string;
  businessIdea: string;
  targetMarket: string;
  startupCosts: number;
  revenueProjection: number;
  amountRequested: number;
  createdAt: string;
  opportunity?: Opportunity;
  feasibilityScore?: FeasibilityScore | null;
  application?: { id: string; status: string } | null;
}

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'REPAYING'
  | 'CLOSED';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'DISBURSED',
  'REPAYING',
  'CLOSED',
];

export interface Application {
  id: string;
  applicantId: string;
  opportunityId: string;
  businessPlanId: string;
  status: ApplicationStatus;
  amountDisbursed: number | null;
  createdAt: string;
  opportunity?: Opportunity;
  businessPlan?: BusinessPlan & { feasibilityScore?: FeasibilityScore | null };
  repayments?: Repayment[];
}

export interface Repayment {
  id: string;
  applicationId: string;
  amount: number;
  date: string;
  note: string | null;
}

export interface RepaymentSummary {
  totalDisbursed: number;
  totalRepaid: number;
  remainingBalance: number;
  repaymentPercentage: number;
}

export type BookingStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface Booking {
  id: string;
  applicantId: string;
  advisorId: string;
  status: BookingStatus;
  price: number;
  note: string | null;
  createdAt: string;
  applicant?: Pick<User, 'id' | 'name' | 'email'>;
  advisor?: Pick<User, 'id' | 'name' | 'email'> & { advisorProfile?: AdvisorProfile | null };
}

export interface Product {
  id: string;
  applicantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  applicant?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface AuthResponse {
  token: string;
  user: User;
}