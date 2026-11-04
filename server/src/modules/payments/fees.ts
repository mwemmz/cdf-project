// Simulated fee schedule. Rates are illustrative assumptions for the pitch,
// not agreed commercial terms.
export const ADVISOR_COMMISSION_RATE = 0.15; // taken from each paid advisor session
export const MARKETPLACE_COMMISSION_RATE = 0.08; // taken from each marketplace sale
export const ASSESSMENT_FEE_ZMW = 150; // paid by the business owner, 100% to FundPath

export function splitAmount(gross: number, rate: number) {
  const commissionAmount = Math.round(gross * rate * 100) / 100;
  const netAmount = Math.round((gross - commissionAmount) * 100) / 100;
  return { commissionAmount, netAmount };
}
