export interface FeasibilityInput {
  businessIdea: string;
  targetMarket: string;
  startupCosts: number;
  revenueProjection: number;
  amountRequested: number;
  amountAvailable: number;
}

export type FeasibilityCategory = 'Low' | 'Medium' | 'High';

export interface FeasibilityResult {
  score: number;
  category: FeasibilityCategory;
  recommendations: string;
}

function isMeaningful(text: string, minLength: number): boolean {
  return text.trim().length >= minLength;
}

function fmtK(amount: number): string {
  return Math.round(amount).toLocaleString('en-ZM');
}

export function scoreFeasibility(input: FeasibilityInput): FeasibilityResult {
  const notes: string[] = [];

  // Factor 1 (40%): Realistic cost-to-revenue ratio
  const safeRatio = input.startupCosts > 0 ? input.revenueProjection / input.startupCosts : 0;
  let ratioScore: number;
  if (safeRatio >= 2) {
    ratioScore = 100;
    notes.push(`Revenue is ${safeRatio.toFixed(1)}x startup costs — a strong return on investment.`);
  } else if (safeRatio >= 1.2) {
    ratioScore = 80;
    notes.push(`Revenue covers startup costs ${safeRatio.toFixed(1)}x — realistic but with room to grow.`);
  } else if (safeRatio >= 0.8) {
    ratioScore = 60;
    notes.push(`Revenue reaches only ${safeRatio.toFixed(1)}x startup costs — consider trimming costs or raising prices.`);
  } else if (safeRatio >= 0.4) {
    ratioScore = 40;
    notes.push(`Revenue barely approaches startup costs (${safeRatio.toFixed(1)}x) — this plan looks risky.`);
  } else {
    ratioScore = 20;
    notes.push(`Projected revenue is far below startup costs — revisit the financial model.`);
  }

  // Factor 2 (40%): Requested amount vs the opportunity's amountAvailable cap
  let capScore: number;
  if (input.amountRequested <= input.amountAvailable) {
    capScore = 100;
    notes.push(`The K${fmtK(input.amountRequested)} request is within the opportunity's K${fmtK(input.amountAvailable)} funding pool.`);
  } else if (input.amountRequested <= input.amountAvailable * 1.2) {
    capScore = 70;
    notes.push(`The request slightly exceeds the K${fmtK(input.amountAvailable)} funding pool — a small reduction would help.`);
  } else if (input.amountRequested <= input.amountAvailable * 1.5) {
    capScore = 40;
    notes.push(`The request exceeds the K${fmtK(input.amountAvailable)} funding cap by a notable margin.`);
  } else {
    capScore = 20;
    notes.push(`The request is far above what this opportunity can fund.`);
  }

  // Factor 3 (20%): Completeness of the plan
  const checks = [
    isMeaningful(input.businessIdea, 30),
    isMeaningful(input.targetMarket, 20),
    input.startupCosts > 0,
    input.revenueProjection > 0,
    input.amountRequested > 0,
  ];
  const completenessScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  if (checks.every(Boolean)) {
    notes.push('All required fields are filled in meaningfully.');
  } else {
    notes.push('Some fields are blank or too short — complete them for a better score.');
  }

  const score = Math.round(ratioScore * 0.4 + capScore * 0.4 + completenessScore * 0.2);
  const category: FeasibilityCategory = score >= 70 ? 'High' : score >= 45 ? 'Medium' : 'Low';

  return {
    score,
    category,
    recommendations: `${notes.join(' ')} Overall feasibility: ${category}.`,
  };
}
