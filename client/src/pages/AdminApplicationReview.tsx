import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtDate, fmtZmk } from '../lib/format';
import type { ApplicationStatus } from '../lib/types';

interface Repayment {
  id: string;
  amount: number;
  date: string;
}

interface ApplicationDetail {
  id: string;
  status: ApplicationStatus;
  amountDisbursed: number | null;
  createdAt: string;
  applicant: { name: string; email: string };
  opportunity: { constituencyName: string; category: string; amountAvailable: number };
  businessPlan: {
    businessIdea: string;
    targetMarket: string;
    startupCosts: number;
    revenueProjection: number;
    amountRequested: number;
    feasibilityScore: { score: number; category: string; recommendations: string | null } | null;
  };
  repayments: Repayment[];
  allowedTransitions: ApplicationStatus[];
}

const stageLabels: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
  REPAYING: 'Repaying',
  CLOSED: 'Closed',
};

export default function AdminApplicationReview() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [disburseAmount, setDisburseAmount] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<ApplicationDetail>(`/applications/${applicationId}`);
      setApplication(data);
      setDisburseAmount(String(data.businessPlan.amountRequested));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function transition(status: ApplicationStatus) {
    if (!application) return;
    setBusy(true);
    setActionError(null);
    try {
      const body: Record<string, unknown> = { status };
      if (status === 'DISBURSED') {
        body.amountDisbursed = Number(disburseAmount);
      }
      await api(`/applications/${application.id}/status`, { method: 'PATCH', body });
      await load();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  }
  if (!application) {
    return <div className="text-sm text-slate-500">Loading application…</div>;
  }

  const repaid = application.repayments.reduce((sum, r) => sum + r.amount, 0);
  const balance = Math.max((application.amountDisbursed ?? 0) - repaid, 0);
  const nextStages = application.allowedTransitions;
  const score = application.businessPlan.feasibilityScore;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/applications" className="text-sm font-medium text-brand-600 underline">
          ← Back to queue
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">{application.applicant.name}</h2>
            <p className="text-sm text-slate-500">{application.applicant.email}</p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            {stageLabels[application.status]}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Opportunity</dt>
            <dd className="font-medium text-slate-900">
              {application.opportunity.constituencyName} · {application.opportunity.category}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Requested</dt>
            <dd className="font-medium text-slate-900">{fmtZmk(application.businessPlan.amountRequested)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Disbursed</dt>
            <dd className="font-medium text-slate-900">
              {application.amountDisbursed ? fmtZmk(application.amountDisbursed) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Submitted</dt>
            <dd className="font-medium text-slate-900">{fmtDate(application.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {score && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-base font-semibold text-slate-900">Feasibility assessment</h3>
          <p className="mt-2 text-sm text-slate-700">
            Score <span className="font-semibold text-slate-900">{score.score}</span> · rated{' '}
            <span className="font-semibold text-slate-900">{score.category}</span>
          </p>
          {score.recommendations && <p className="mt-2 text-sm text-slate-600">{score.recommendations}</p>}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-display text-base font-semibold text-slate-900">Business plan</h3>
        <p className="mt-2 text-sm font-medium text-slate-900">{application.businessPlan.businessIdea}</p>
        <p className="text-sm text-slate-600">Target market: {application.businessPlan.targetMarket}</p>
        <p className="text-sm text-slate-600">
          Startup costs {fmtZmk(application.businessPlan.startupCosts)} · projected revenue{' '}
          {fmtZmk(application.businessPlan.revenueProjection)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-display text-base font-semibold text-slate-900">Repayments</h3>
        {application.repayments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No repayments recorded.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {application.repayments.map((r) => (
              <li key={r.id}>
                {fmtZmk(r.amount)} — {fmtDate(r.date)}
              </li>
            ))}
          </ul>
        )}
        {application.amountDisbursed && (
          <p className="mt-3 text-sm font-medium text-slate-900">
            Repaid {fmtZmk(repaid)} · outstanding balance {fmtZmk(balance)}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-display text-base font-semibold text-slate-900">Review actions</h3>
        {actionError && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
        )}
        {nextStages.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">This application has reached a terminal stage.</p>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {nextStages.includes('DISBURSED') && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                Disbursement amount
                <input
                  type="number"
                  min="1"
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(e.target.value)}
                  className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            )}
            {nextStages.map((stage) => (
              <button
                key={stage}
                type="button"
                disabled={busy}
                onClick={() => transition(stage)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  stage === 'REJECTED'
                    ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {stage === 'DISBURSED' ? 'Disburse' : `Mark as ${stageLabels[stage]}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
