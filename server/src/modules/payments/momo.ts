import { randomBytes } from 'crypto';
import { z } from 'zod';
import { badRequest } from '../../utils/errors';

export type MomoProvider = 'MTN' | 'AIRTEL' | 'ZAMTEL';

// Zambian mobile prefixes (after the leading 0).
const PREFIXES: Record<string, MomoProvider> = {
  '96': 'MTN',
  '76': 'MTN',
  '97': 'AIRTEL',
  '77': 'AIRTEL',
  '95': 'ZAMTEL',
  '55': 'ZAMTEL',
};

export const momoSchema = z.object({
  phone: z.string().min(1, 'Enter your mobile money number'),
  provider: z.enum(['MTN', 'AIRTEL', 'ZAMTEL']).optional(),
});
export type MomoInput = z.infer<typeof momoSchema>;

/** Accepts 097xxxxxxx, 97xxxxxxx, 26097xxxxxxx or +26097xxxxxxx. Returns the 9 national digits. */
export function normalisePhone(raw: string): string {
  let d = raw.replace(/[\s()-]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('260')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  if (!/^\d{9}$/.test(d)) throw badRequest('Enter a valid Zambian mobile number, e.g. 097 123 4567');
  return d;
}

export interface MomoDetails {
  method: string;
  provider: string | null;
  phoneMasked: string | null;
  providerRef: string | null;
}

/**
 * Simulates a mobile money prompt. No money moves; we validate the number,
 * work out the network and return a fake provider reference.
 */
export function simulateMomo(input?: MomoInput | null): MomoDetails {
  if (!input) return { method: 'SIMULATED', provider: null, phoneMasked: null, providerRef: null };
  const national = normalisePhone(input.phone);
  const network = PREFIXES[national.slice(0, 2)];
  if (!network) throw badRequest('That number does not look like an MTN, Airtel or Zamtel number');
  if (input.provider && input.provider !== network) {
    throw badRequest(`That number belongs to ${network}, not ${input.provider}`);
  }
  return {
    method: 'MOBILE_MONEY',
    provider: network,
    phoneMasked: `+260 ${national.slice(0, 2)}• ••• ${national.slice(-3)}`,
    providerRef: `${network.slice(0, 2)}${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`,
  };
}

export function newReceiptNo(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `FP-${d}-${randomBytes(3).toString('hex').toUpperCase()}`;
}
