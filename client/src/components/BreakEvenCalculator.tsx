import { useMemo, useState } from 'react';
import { Card } from './UI';

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function BreakEvenCalculator() {
  const [fixed, setFixed] = useState('');
  const [variable, setVariable] = useState('');
  const [price, setPrice] = useState('');

  const result = useMemo(() => {
    const fixedCosts = toNumber(fixed);
    const variableCost = toNumber(variable);
    const unitPrice = toNumber(price);
    const contribution = unitPrice - variableCost;

    if (fixedCosts <= 0 || unitPrice <= 0) return null;
    if (contribution <= 0) {
      return { impossible: true as const, contribution, breakEvenUnits: 0, breakEvenRevenue: 0 };
    }
    const breakEvenUnits = fixedCosts / contribution;
    return {
      impossible: false as const,
      contribution,
      breakEvenUnits,
      breakEvenRevenue: breakEvenUnits * unitPrice,
    };
  }, [fixed, variable, price]);

  const field =
    'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100';

  return (
    <Card>
      <h2 className="font-semibold text-slate-900">Break-even / ROI calculator</h2>
      <p className="mt-1 text-sm text-slate-500">
        Quick check of how many units a client must sell to cover their fixed costs.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Fixed costs (K)</span>
          <input className={field} type="number" min={0} step="any" value={fixed} onChange={(e) => setFixed(e.target.value)} placeholder="e.g. 20000" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Variable cost / unit (K)</span>
          <input className={field} type="number" min={0} step="any" value={variable} onChange={(e) => setVariable(e.target.value)} placeholder="e.g. 15" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Price / unit (K)</span>
          <input className={field} type="number" min={0} step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 25" />
        </label>
      </div>

      {result && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {result.impossible ? (
            <p className="text-sm text-rose-700">
              Price per unit must be higher than the variable cost — the client loses money on every sale.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <div className="text-xs text-slate-400">Contribution / unit</div>
                <div className="font-semibold text-slate-900">K{result.contribution.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Break-even units</div>
                <div className="font-semibold text-slate-900">{Math.ceil(result.breakEvenUnits).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Break-even revenue</div>
                <div className="font-semibold text-slate-900">K{Math.ceil(result.breakEvenRevenue).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}