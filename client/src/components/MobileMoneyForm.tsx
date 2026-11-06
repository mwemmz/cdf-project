import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtMoney } from '../lib/format';
import { Alert, PrimaryButton } from './UI';

export type Provider = 'MTN' | 'AIRTEL' | 'ZAMTEL';
export interface MomoPayment {
  phone: string;
  provider: Provider;
}

const PROVIDERS: { id: Provider; label: string; hint: string; chip: string }[] = [
  { id: 'MTN', label: 'MTN MoMo', hint: '096 / 076', chip: 'bg-yellow-300 text-yellow-950' },
  { id: 'AIRTEL', label: 'Airtel Money', hint: '097 / 077', chip: 'bg-red-500 text-white' },
  { id: 'ZAMTEL', label: 'Zamtel Kwacha', hint: '095 / 055', chip: 'bg-emerald-600 text-white' },
];

function detect(raw: string): Provider | null {
  let d = raw.replace(/[\s()-]/g, '').replace(/^\+/, '');
  if (d.startsWith('260')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  const p = d.slice(0, 2);
  if (p === '96' || p === '76') return 'MTN';
  if (p === '97' || p === '77') return 'AIRTEL';
  if (p === '95' || p === '55') return 'ZAMTEL';
  return null;
}

type Step = 'form' | 'prompt' | 'done';

/**
 * Simulated mobile money checkout. The person enters a number, we pretend to send a
 * PIN prompt to the phone, then the caller's onPay records the payment and returns the receipt id.
 * No money moves.
 */
export default function MobileMoneyForm({
  title,
  amount,
  onPay,
  onClose,
}: {
  title: string;
  amount: number;
  onPay: (payment: MomoPayment) => Promise<string | undefined>;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState<Provider>('MTN');
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | undefined>();

  useEffect(() => {
    const d = detect(phone);
    if (d) setProvider(d);
  }, [phone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && step !== 'prompt' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (phone.replace(/\D/g, '').length < 9) {
      setError('Enter your 10-digit mobile money number, e.g. 097 123 4567');
      return;
    }
    setStep('prompt');
    // Pretend the network is waiting for the customer to approve with their PIN.
    await new Promise((r) => setTimeout(r, 2200));
    try {
      setReceiptId(await onPay({ phone, provider }));
      setStep('done');
    } catch (err) {
      setError((err as Error).message);
      setStep('form');
    }
  };

  const active = PROVIDERS.find((p) => p.id === provider)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Pay with mobile money"
      onClick={(e) => e.target === e.currentTarget && step !== 'prompt' && onClose()}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile money · simulated</p>
        <h2 className="mt-1 font-display text-xl font-bold">{title}</h2>
        <p className="mt-1 text-2xl font-bold text-brand-700">{fmtMoney(amount)}</p>

        {step === 'form' && (
          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-slate-700">Network</legend>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    aria-pressed={provider === p.id}
                    className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold transition ${
                      provider === p.id ? `${p.chip} border-transparent ring-2 ring-slate-900/20` : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                    <span className="block text-[10px] font-normal opacity-80">{p.hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Mobile money number</span>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-600">
                  +260
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  autoFocus
                  placeholder="97 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-r-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
                />
              </div>
            </label>
            {error && <Alert kind="error">{error}</Alert>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <PrimaryButton type="submit" className="flex-1">
                Pay {fmtMoney(amount)} with {active.label}
              </PrimaryButton>
            </div>
            <p className="text-xs text-slate-500">Demo only. No real money is taken and your full number is not stored.</p>
          </form>
        )}

        {step === 'prompt' && (
          <div className="mt-6 space-y-3 text-center" role="status">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200" style={{ borderTopColor: '#178158' }} />
            <p className="font-semibold">Check your phone</p>
            <p className="text-sm text-slate-600">
              Approve the {active.label} prompt for {fmtMoney(amount)} by entering your PIN.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-5 space-y-4" role="status">
            <Alert kind="success">Payment approved. Your receipt is ready.</Alert>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              {receiptId && (
                <Link
                  to={`/receipts/${receiptId}`}
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700"
                >
                  View receipt
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
