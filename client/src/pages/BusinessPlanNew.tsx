import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { BusinessPlan, FeasibilityScore, Opportunity } from '../lib/types';
import { fmtDate, fmtZmk } from '../lib/format';
import { Card, ErrorNote, Field, FieldArea, Loading, PageHeader, PrimaryButton } from '../components/UI';

interface FormState {
  businessIdea: string;
  targetMarket: string;
  startupCosts: string;
  revenueProjection: string;
  amountRequested: string;
}

const emptyForm: FormState = {
  businessIdea: '',
  targetMarket: '',
  startupCosts: '',
  revenueProjection: '',
  amountRequested: '',
};

const STEPS = ['Business idea', 'Target market', 'Startup costs', 'Revenue projections', 'Funding & review'];

export default function BusinessPlanNew() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const opportunityId = params.get('opportunity') ?? '';

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ plan: BusinessPlan; feasibilityScore: FeasibilityScore } | null>(null);

  useEffect(() => {
    if (!opportunityId) return;
    api<Opportunity>(`/opportunities/${opportunityId}`)
      .then(setOpportunity)
      .catch(() => setOpportunity(null));
  }, [opportunityId]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validateStep = (i: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (i === 0 && form.businessIdea.trim().length < 30) e.businessIdea = 'At least 30 characters';
    if (i === 1 && form.targetMarket.trim().length < 20) e.targetMarket = 'At least 20 characters';
    if (i === 2 && Number(form.startupCosts) <= 0) e.startupCosts = 'Enter an amount greater than 0';
    if (i === 3 && Number(form.revenueProjection) <= 0) e.revenueProjection = 'Enter an amount greater than 0';
    if (i === 4 && Number(form.amountRequested) <= 0) e.amountRequested = 'Enter an amount greater than 0';
    return e;
  };

  const next = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const e2 = validateStep(4);
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;

    setSaving(true);
    setError(null);
    try {
      const res = await api<{ plan: BusinessPlan; feasibilityScore: FeasibilityScore }>('/business-plans', {
        method: 'POST',
        body: {
          opportunityId,
          businessIdea: form.businessIdea,
          targetMarket: form.targetMarket,
          startupCosts: Number(form.startupCosts),
          revenueProjection: Number(form.revenueProjection),
          amountRequested: Number(form.amountRequested),
        },
      });
      setResult(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <h1 className="text-xl font-bold text-slate-900">Business plan saved</h1>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-brand-600">{result.feasibilityScore.score}/100</div>
              <div>
                <div className="font-medium text-slate-900">Feasibility: {result.feasibilityScore.category}</div>
                <div className="text-sm text-slate-500">Scored by FundPath's rules engine</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{result.feasibilityScore.recommendations}</p>
          </div>
          <div className="mt-5 flex gap-3">
            <PrimaryButton onClick={() => navigate(`/plans/${result.plan.id}`)}>View plan summary</PrimaryButton>
            <PrimaryButton onClick={() => navigate('/applications')} className="bg-slate-700 hover:bg-slate-800">
              My applications
            </PrimaryButton>
          </div>
        </Card>
      </div>
    );
  }

  if (!opportunityId) {
    return <ErrorNote message="Choose an opportunity first — browse /opportunities and click 'Start an application'." />;
  }
  if (!opportunity) return <Loading />;

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Build your business plan"
        subtitle={`For ${opportunity.constituencyName} (${opportunity.category}) — pool ${fmtZmk(opportunity.amountAvailable)}, deadline ${fmtDate(opportunity.deadline)}`}
      />

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            Step {step + 1} of {STEPS.length}: <span className="font-medium text-slate-700">{STEPS[step]}</span>
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded bg-slate-200">
          <div className="h-2 rounded bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={submit}>
        <Card>
          {step === 0 && (
            <FieldArea
              label="Describe your business idea"
              placeholder="What will the business do, who runs it, and why does it make sense here?"
              rows={6}
              value={form.businessIdea}
              onChange={set('businessIdea')}
              error={errors.businessIdea}
              required
            />
          )}

          {step === 1 && (
            <FieldArea
              label="Who is your target market?"
              placeholder="Who are your customers, how big is the demand, and how will you reach them?"
              rows={6}
              value={form.targetMarket}
              onChange={set('targetMarket')}
              error={errors.targetMarket}
              required
            />
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field
                label="Startup costs (K)"
                type="number"
                min={1}
                step="any"
                value={form.startupCosts}
                onChange={set('startupCosts')}
                error={errors.startupCosts}
                placeholder="e.g. 60000"
                required
              />
              <p className="text-sm text-slate-500">
                Equipment, stock, licences, premises and other one-off setup costs.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Field
                label="Projected revenue in year one (K)"
                type="number"
                min={1}
                step="any"
                value={form.revenueProjection}
                onChange={set('revenueProjection')}
                error={errors.revenueProjection}
                placeholder="e.g. 155000"
                required
              />
              <p className="text-sm text-slate-500">
                Your realistic estimate of what the business will earn in its first 12 months.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Field
                label="Funding amount requested (K)"
                type="number"
                min={1}
                step="any"
                value={form.amountRequested}
                onChange={set('amountRequested')}
                error={errors.amountRequested}
                placeholder={`Up to ${fmtZmk(opportunity.amountAvailable)}`}
                required
              />
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-800">Idea:</span> {form.businessIdea.slice(0, 90)}…
                </p>
                <p className="mt-1">
                  <span className="font-medium text-slate-800">Target market:</span> {form.targetMarket.slice(0, 90)}…
                </p>
                <p className="mt-1">
                  <span className="font-medium text-slate-800">Startup costs:</span> {fmtZmk(Number(form.startupCosts) || 0)} ·{' '}
                  <span className="font-medium text-slate-800">Revenue:</span> {fmtZmk(Number(form.revenueProjection) || 0)}
                </p>
                <p className="mt-2 text-xs">
                  Saving this plan automatically runs FundPath's feasibility scoring engine.
                </p>
              </div>
            </div>
          )}

          {error && <div className="mt-4"><ErrorNote message={error} /></div>}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <PrimaryButton type="button" onClick={next}>
                Continue
              </PrimaryButton>
            ) : (
              <PrimaryButton type="submit" loading={saving}>
                Save plan &amp; score it
              </PrimaryButton>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
}