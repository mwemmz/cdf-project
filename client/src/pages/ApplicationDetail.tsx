import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type {
  Application,
  Repayment,
  RepaymentSummary,
} from '../lib/types';
import { fmtDate, fmtPct, fmtZmk } from '../lib/format';
import { APPLICATION_COLORS, APPLICATION_LABELS, FEASIBILITY_COLORS } from '../lib/status';
import { ApplicationTracker } from '../components/ApplicationTracker';
import { Card, ErrorNote, Field, FieldArea, Loading, PageHeader, PrimaryButton } from '../components/UI';

interface RepaymentsData {
  application: { id: string; status: string; amountDisbursed: number; constituency: string };
  repayments: Repayment[];
  summary: RepaymentSummary;
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [repayments, setRepayments] = useState<RepaymentsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: '', date: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api<Application>(`/applications/${id}`)
      .then(setApplication)
      .catch((err) => setError((err as Error).message));
    api<RepaymentsData>(`/repayments/application/${id}`)
      .then(setRepayments)
      .catch(() => setRepayments(null));
  };

  useEffect(load, [id]);

  const logRepayment = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api('/repayments', {
        method: 'POST',
        body: {
          applicationId: id,
          amount: Number(form.amount),
          date: form.date ? new Date(form.date).toISOString() : undefined,
          note: form.note,
        },
      });
      setForm({ amount: '', date: '', note: '' });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !application) return <ErrorNote message={error} />;
  if (!application) return <Loading />;

  const canRepay = application.status === 'DISBURSED' || application.status === 'REPAYING';
  const storefrontUnlocked = ['DISBURSED', 'REPAYING', 'CLOSED'].includes(application.status);
  const summary = repayments?.summary;
  const feasibility = application.businessPlan?.feasibilityScore;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Application details" subtitle={`${application.opportunity?.constituencyName} · ${application.opportunity?.category}`} />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Submitted {fmtDate(application.createdAt)} ·{' '}
            {application.amountDisbursed != null ? `Disbursed ${fmtZmk(application.amountDisbursed)}` : 'Not yet disbursed'}
          </div>
          <span className={`rounded px-2 py-1 text-xs font-semibold ${APPLICATION_COLORS[application.status]}`}>
            {APPLICATION_LABELS[application.status]}
          </span>
        </div>
        <ApplicationTracker status={application.status} />
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-900">Business plan</h2>
        <p className="mt-2 whitespace-pre-line text-slate-700">{application.businessPlan?.businessIdea}</p>
        <p className="mt-3 whitespace-pre-line text-slate-700">
          <span className="font-medium">Market:</span> {application.businessPlan?.targetMarket}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-400">Requested</div>
            <div className="font-medium">{fmtZmk(application.businessPlan?.amountRequested ?? 0)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Startup</div>
            <div className="font-medium">{fmtZmk(application.businessPlan?.startupCosts ?? 0)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Revenue</div>
            <div className="font-medium">{fmtZmk(application.businessPlan?.revenueProjection ?? 0)}</div>
          </div>
        </div>
        {feasibility && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
            <span className={`mr-2 rounded px-2 py-0.5 text-xs font-semibold ${FEASIBILITY_COLORS[feasibility.category]}`}>
              {feasibility.score}/100
            </span>
            <span className="text-slate-600">{feasibility.recommendations}</span>
          </div>
        )}
      </Card>

      {storefrontUnlocked && (
        <Card className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">Storefront unlocked</div>
              <div className="text-sm text-slate-600">
                Your loan is disbursed — you can now sell your products on the public marketplace.
              </div>
            </div>
            <Link to="/storefront" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Open storefront
            </Link>
          </div>
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-900">Repayments</h2>

        {summary && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Disbursed', value: fmtZmk(summary.totalDisbursed) },
              { label: 'Repaid', value: fmtZmk(summary.totalRepaid) },
              { label: 'Remaining', value: fmtZmk(summary.remainingBalance) },
              { label: 'Repaid %', value: fmtPct(summary.repaymentPercentage) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-slate-50 p-3 text-center">
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className="font-semibold text-slate-900">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {canRepay && (
          <form onSubmit={logRepayment} className="mt-4 rounded-lg border border-slate-200 p-4">
            <div className="mb-3 text-sm font-medium text-slate-700">Log a repayment</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Amount (K)"
                type="number"
                min={1}
                step="any"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
              <Field
                label="Date (optional)"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
              <FieldArea
                label="Note (optional)"
                rows={1}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            {error && <div className="mt-3"><ErrorNote message={error} /></div>}
            <PrimaryButton type="submit" loading={saving} className="mt-3">
              Log repayment
            </PrimaryButton>
          </form>
        )}

        {!canRepay && application.status !== 'REJECTED' && (
          <p className="mt-3 text-sm text-slate-500">
            Repayments unlock once the application is disbursed.
          </p>
        )}

        {repayments && (
          <div className="mt-4">
            <div className="mb-2 text-sm font-medium text-slate-700">History (most recent first)</div>
            {repayments.repayments.length === 0 ? (
              <p className="text-sm text-slate-500">No repayments logged yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                {repayments.repayments.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-900">{fmtZmk(r.amount)}</span>
                      {r.note && <span className="ml-2 text-slate-500">{r.note}</span>}
                    </div>
                    <div className="text-slate-500">{fmtDate(r.date)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}