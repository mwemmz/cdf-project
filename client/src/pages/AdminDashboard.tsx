import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtZmk } from '../lib/format';
import { ApplicationStatus } from '../lib/types';

interface Summary {
  applications: { total: number; byStage: Record<ApplicationStatus, number> };
  money: { requested: number; disbursed: number; repaid: number; outstanding: number };
  advisorsAwaitingVerification: number;
  opportunities: number;
  feasibility: { High: number; Medium: number; Low: number };
  demandByConstituency: { constituencyName: string; applications: number }[];
}

const stageOrder: ApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'DISBURSED',
  'REPAYING',
  'CLOSED',
  'REJECTED',
];

const stageLabels: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
  REPAYING: 'Repaying',
  CLOSED: 'Closed',
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Summary>('/admin/summary')
      .then(setSummary)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  }
  if (!summary) {
    return <div className="text-sm text-slate-500">Loading summary…</div>;
  }

  const maxStage = Math.max(...stageOrder.map((s) => summary.applications.byStage[s] ?? 0), 1);
  const feasibilityRows: { label: string; count: number; tone: string }[] = [
    { label: 'High', count: summary.feasibility.High ?? 0, tone: 'bg-emerald-600' },
    { label: 'Medium', count: summary.feasibility.Medium ?? 0, tone: 'bg-amber-500' },
    { label: 'Low', count: summary.feasibility.Low ?? 0, tone: 'bg-rose-500' },
  ];
  const maxFeasibility = Math.max(...feasibilityRows.map((r) => r.count), 1);
  const demandRows = summary.demandByConstituency.slice(0, 8);
  const maxDemand = Math.max(...demandRows.map((r) => r.applications), 1);
  const moneyRows = [
    { label: 'Disbursed', value: summary.money.disbursed, tone: 'bg-brand-600' },
    { label: 'Repaid', value: summary.money.repaid, tone: 'bg-copper-500' },
  ];
  const maxMoney = Math.max(...moneyRows.map((r) => r.value), 1);
  const cards = [
    { label: 'Money requested', value: fmtZmk(summary.money.requested) },
    { label: 'Disbursed', value: fmtZmk(summary.money.disbursed) },
    { label: 'Repaid', value: fmtZmk(summary.money.repaid) },
    { label: 'Outstanding', value: fmtZmk(summary.money.outstanding) },
    { label: 'Applications', value: String(summary.applications.total) },
    { label: 'Advisors awaiting verification', value: String(summary.advisorsAwaitingVerification) },
    { label: 'Opportunities', value: String(summary.opportunities) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-1 font-display text-lg font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-base font-semibold text-slate-900">Applications by stage</h2>
        <div className="mt-4 space-y-2.5">
          {stageOrder.map((stage) => {
            const count = summary.applications.byStage[stage] ?? 0;
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm text-slate-600">{stageLabels[stage]}</span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                  <div
                    className={count > 0 ? 'h-full rounded bg-brand-600' : 'h-full'}
                    style={{ width: `${(count / maxStage) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium text-slate-900">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-base font-semibold text-slate-900">Feasibility distribution</h2>
          <p className="mt-0.5 text-xs text-slate-500">Score categories across submitted plans.</p>
          <div className="mt-4 space-y-2.5">
            {feasibilityRows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-sm text-slate-600">{row.label}</span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                  <div
                    className={row.count > 0 ? `h-full rounded ${row.tone}` : 'h-full'}
                    style={{ width: `${(row.count / maxFeasibility) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium text-slate-900">{row.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-base font-semibold text-slate-900">Demand by constituency</h2>
          <p className="mt-0.5 text-xs text-slate-500">Applications per opportunity, most-demanded first.</p>
          {demandRows.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No applications yet.</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {demandRows.map((row) => (
                <div key={row.constituencyName} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-slate-600">{row.constituencyName}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full rounded bg-brand-600"
                      style={{ width: `${(row.applications / maxDemand) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium text-slate-900">{row.applications}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-base font-semibold text-slate-900">Disbursed vs repaid</h2>
        <p className="mt-0.5 text-xs text-slate-500">How much of the disbursed money has come back.</p>
        <div className="mt-4 space-y-2.5">
          {moneyRows.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm text-slate-600">{row.label}</span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                <div
                  className={row.value > 0 ? `h-full rounded ${row.tone}` : 'h-full'}
                  style={{ width: `${(row.value / maxMoney) * 100}%` }}
                />
              </div>
              <span className="w-24 text-right text-sm font-medium text-slate-900">{fmtZmk(row.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Review applications in the{' '}
        <Link to="/admin/applications" className="font-medium text-brand-600 underline">
          application queue
        </Link>
        .
      </p>
    </div>
  );
}
