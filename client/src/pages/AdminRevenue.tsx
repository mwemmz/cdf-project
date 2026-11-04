import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { RevenueSummary, TransactionKind } from '../lib/types';
import { fmtDateTime, fmtMoney } from '../lib/format';
import { Card, ErrorNote, Loading } from '../components/UI';

const KIND_LABELS: Record<TransactionKind, string> = {
  ADVISOR_SESSION: 'Advisor sessions',
  MARKETPLACE_SALE: 'Marketplace sales',
  PLAN_ASSESSMENT: 'Plan & risk assessments',
};

export default function AdminRevenue() {
  const [data, setData] = useState<RevenueSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<RevenueSummary>('/admin/revenue')
      .then(setData)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!data) return <Loading />;

  const pct = (r: number) => `${Math.round(r * 100)}%`;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Simulation.</strong> No real money moves. These figures show what FundPath would collect at the
        assumed rates: advisor sessions {pct(data.rates.advisor)}, marketplace sales {pct(data.rates.marketplace)},
        assessment fee {fmtMoney(data.rates.assessmentFee)} per plan.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="text-center">
          <div className="text-2xl font-bold text-slate-900">{fmtMoney(data.totalCommission)}</div>
          <div className="mt-1 text-xs text-slate-600">FundPath commission collected (simulated)</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-slate-900">{fmtMoney(data.totalGross)}</div>
          <div className="mt-1 text-xs text-slate-600">Total payment volume (simulated)</div>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-slate-900">By revenue stream</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 font-medium">Stream</th>
              <th className="py-2 font-medium">Payments</th>
              <th className="py-2 font-medium">Volume</th>
              <th className="py-2 font-medium">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(Object.keys(KIND_LABELS) as TransactionKind[]).map((k) => {
              const row = data.byKind.find((b) => b.kind === k);
              return (
                <tr key={k}>
                  <td className="py-2.5">{KIND_LABELS[k]}</td>
                  <td className="py-2.5">{row?.count ?? 0}</td>
                  <td className="py-2.5">{fmtMoney(row?.gross ?? 0)}</td>
                  <td className="py-2.5 font-semibold">{fmtMoney(row?.commission ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">Recent payments</h2>
        {data.recent.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            None yet. Mark a booking as paid, buy a marketplace product, or pay for a plan assessment.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 font-medium">When</th>
                  <th className="py-2 font-medium">What</th>
                  <th className="py-2 font-medium">Payer</th>
                  <th className="py-2 font-medium">Paid</th>
                  <th className="py-2 font-medium">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 text-xs text-slate-600">{fmtDateTime(t.createdAt)}</td>
                    <td className="py-2.5">{KIND_LABELS[t.kind]} <span className="text-xs text-slate-500">· {t.description}</span></td>
                    <td className="py-2.5">{t.payer.name}</td>
                    <td className="py-2.5">{fmtMoney(t.grossAmount)}</td>
                    <td className="py-2.5 font-semibold text-emerald-700">{fmtMoney(t.commissionAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
