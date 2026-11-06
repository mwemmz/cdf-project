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
  rating?: { average: number; count: number };
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
  advisorId?: string | null;
  businessIdea: string;
  targetMarket: string;
  startupCosts: number;
  revenueProjection: number;
  amountRequested: number;
  createdAt: string;
  opportunity?: Opportunity;
  feasibilityScore?: FeasibilityScore | null;
  application?: { id: string; status: string } | null;
  advisor?: Pick<User, 'id' | 'name'> | null;
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
  disbursedAt?: string | null;
  repaymentDueDate?: string | null;
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
  interest: number;
  totalDue: number;
  totalRepaid: number;
  remainingBalance: number;
  repaymentPercentage: number;
}

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
  review?: Review | null;
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

export interface Message {
  id: string;
  bookingId?: string;
  threadId?: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: Pick<User, 'id' | 'name'>;
}

export type NotificationType =
  | 'FEASIBILITY_READY'
  | 'NEW_MESSAGE'
  | 'REPAYMENT_DUE'
  | 'APPLICATION_STATUS'
  | 'NEW_REVIEW';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  applicantId: string;
  advisorId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  applicantName?: string;
}

export interface AdvisorReviews {
  average: number;
  count: number;
  reviews: Review[];
}

export interface AdvisorClient {
  applicant: Pick<User, 'id' | 'name' | 'email'>;
  bookings: number;
  sessionsCompleted: number;
  planId: string | null;
  planStatus: string;
  feasibilityScore: number | null;
  feasibilityCategory: string | null;
  applicationStatus: ApplicationStatus | null;
  linkedToMe: boolean;
}

export interface AdvisorClientsData {
  stats: {
    activeClients: number;
    totalClients: number;
    averageFeasibilityScore: number;
    sessionsCompleted: number;
    repeatBookings: number;
  };
  clients: AdvisorClient[];
}

export interface SuccessStory {
  id: string;
  applicantId: string;
  applicantName: string;
  businessIdea: string;
  blurb: string;
  constituency: string;
  category: string;
  amountDisbursed: number;
  totalRepaid: number;
  repaymentPercentage: number;
  status: ApplicationStatus;
  hasStorefront: boolean;
  productCount: number;
}

export interface Resource {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
}
export interface Conversation {
  kind: 'booking' | 'product';
  bookingId?: string;
  threadId?: string;
  productName?: string;
  other: { id: string; name: string };
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
  updatedAt: string;
}

export type TransactionKind = 'ADVISOR_SESSION' | 'MARKETPLACE_SALE' | 'PLAN_ASSESSMENT';

export interface Txn {
  id: string;
  kind: TransactionKind;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  description: string;
  createdAt: string;
  payer: { id: string; name: string };
  payee: { id: string; name: string } | null;
}

export interface RevenueSummary {
  totalGross: number;
  totalCommission: number;
  byKind: { kind: TransactionKind; count: number; gross: number; commission: number }[];
  recent: Txn[];
  rates: { advisor: number; marketplace: number; assessmentFee: number };
}
