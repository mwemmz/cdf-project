import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { BusinessPlan, FeasibilityScore } from '../lib/types';
import { fmtDate, fmtMoney, fmtZmk } from '../lib/format';
import { APPLICATION_LABELS, FEASIBILITY_COLORS } from '../lib/status';
import { Card, ErrorNote, Loading, PageHeader, PrimaryButton } from '../components/UI';

export default function BusinessPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [assessmentPaid, setAssessmentPaid] = useState(false);
  const ASSESSMENT_FEE = 150;

  useEffect(() => {
    api<string[]>('/payments/assessments')
      .then((ids) => setAssessmentPaid(!!id && ids.includes(id)))
      .catch(() => undefined);
  }, [id]);

  const payAssessment = async () => {
    setBusy(true);
    setError(null);
    try {
      await api('/payments/assessment', { method: 'POST', body: { businessPlanId: id } });
      setAssessmentPaid(true);
      setNotice('Assessment fee paid (simulated).');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const load = () => {
    api<BusinessPlan>(`/business-plans/${id}`)
      .then(setPlan)
      .catch((err) => setError((err as Error).message));
  };

  useEffect(load, [id]);

  const rescore = async () => {
    setBusy(true);
    setError(null);
    try {
      const score = await api<FeasibilityScore>(`/business-plans/${id}/score`, { method: 'POST' });
      setNotice(`Rescored: ${score.score}/100 (${score.category})`);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitApplication = async () => {
    setBusy(true);
    setError(null);
    try {
      await api('/applications', { method: 'POST', body: { businessPlanId: id } });
      navigate('/applications');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorNote message={error} />;
  if (!plan) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        image={{ src: '/images/score.webp', pos: '50% 72%' }}
        title="Business plan summary"
        subtitle={`Created ${fmtDate(plan.createdAt)}`}
        action={
          <button
            onClick={() => window.print()}
            className="print:hidden rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Download as PDF
          </button>
        }
      />

      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <Card>
        <h2 className="font-semibold text-slate-900">Your idea</h2>
        <p className="mt-1 whitespace-pre-line text-slate-700">{plan.businessIdea}</p>

        <h2 className="mt-5 font-semibold text-slate-900">Target market</h2>
        <p className="mt-1 whitespace-pre-line text-slate-700">{plan.targetMarket}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Startup costs', value: fmtZmk(plan.startupCosts) },
            { label: 'Year-1 revenue', value: fmtZmk(plan.revenueProjection) },
            { label: 'Amount requested', value: fmtZmk(plan.amountRequested) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-slate-50 p-3 text-center">
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="font-semibold text-slate-900">{s.value}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Opportunity: <span className="font-medium">{plan.opportunity?.constituencyName}</span> ({plan.opportunity?.category})
        </p>
      </Card>

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Feasibility score</h2>
          <PrimaryButton onClick={rescore} loading={busy} className="print:hidden bg-slate-700 hover:bg-slate-800">
            Rescore
          </PrimaryButton>
        </div>
        {plan.feasibilityScore ? (
          <div className="mt-3 md:flex md:items-center md:gap-6">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full px-4 py-2 text-2xl font-bold ${
                  FEASIBILITY_COLORS[plan.feasibilityScore.category]
                }`}
              >
                {plan.feasibilityScore.score}
              </div>
              <div>
                <div className="font-medium">{plan.feasibilityScore.category}</div>
                <div className="text-xs text-slate-500">out of 100</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 md:mt-0 md:flex-1">
              {plan.feasibilityScore.recommendations}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No score yet — click Rescore.</p>
        )}
      </Card>

      <Card className="mt-4 print:hidden">
        <h2 className="font-semibold text-slate-900">Plan, risk and market assessment</h2>
        <p className="mt-2 text-sm text-slate-600">
          A deeper review of your plan: risks, market size and competition, with advice on what to fix before you apply.
        </p>
        {assessmentPaid ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">Fee paid (simulated). Assessment unlocked.</p>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <PrimaryButton onClick={payAssessment} loading={busy}>
              Pay {fmtMoney(ASSESSMENT_FEE)} (simulated)
            </PrimaryButton>
            <span className="text-xs text-slate-400">No real money is charged in this prototype.</span>
          </div>
        )}
      </Card>

      <Card className="mt-4 print:hidden">
        <h2 className="font-semibold text-slate-900">Formal application</h2>
        {plan.application ? (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              This plan was submitted. Current status:{' '}
              <span className="font-medium">{APPLICATION_LABELS[plan.application.status]}</span>
            </p>
            <Link to={`/applications`} className="text-sm font-medium text-brand-600 underline">
              View applications
            </Link>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-slate-600">
              Submit this scored plan as a formal application against its opportunity.
            </p>
            <PrimaryButton onClick={submitApplication} loading={busy} className="mt-3">
              Submit as application
            </PrimaryButton>
          </div>
        )}
      </Card>
    </div>
  );
}