import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { BusinessPlan, FeasibilityScore } from '../lib/types';
import { fmtZmk } from '../lib/format';
import { FEASIBILITY_COLORS } from '../lib/status';
import { Card, ErrorNote, Field, FieldArea, Loading, PageHeader, PrimaryButton } from '../components/UI';

interface PlanResponse {
  plan: BusinessPlan;
  feasibilityScore: FeasibilityScore;
}

export default function AdvisorPlanEdit() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [score, setScore] = useState<FeasibilityScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    businessIdea: '',
    targetMarket: '',
    startupCosts: '',
    revenueProjection: '',
    amountRequested: '',
  });

  useEffect(() => {
    if (!id) return;
    api<BusinessPlan>(`/business-plans/${id}`)
      .then((p) => {
        setPlan(p);
        setScore(p.feasibilityScore ?? null);
        setForm({
          businessIdea: p.businessIdea,
          targetMarket: p.targetMarket,
          startupCosts: String(p.startupCosts),
          revenueProjection: String(p.revenueProjection),
          amountRequested: String(p.amountRequested),
        });
      })
      .catch((err) => setError((err as Error).message));
  }, [id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api<PlanResponse>(`/business-plans/${id}`, {
        method: 'PATCH',
        body: {
          businessIdea: form.businessIdea,
          targetMarket: form.targetMarket,
          startupCosts: Number(form.startupCosts),
          revenueProjection: Number(form.revenueProjection),
          amountRequested: Number(form.amountRequested),
        },
      });
      setPlan((p) => (p ? { ...p, ...res.plan } : res.plan));
      setScore(res.feasibilityScore);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !plan) return <ErrorNote message={error} />;
  if (!plan) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Co-edit business plan"
        subtitle={plan.opportunity ? `${plan.opportunity.constituencyName} · ${plan.opportunity.category}` : undefined}
        action={
          <Link to="/advisor/dashboard" className="text-sm font-medium text-brand-600 hover:underline">
            Back to dashboard
          </Link>
        }
      />

      {score && (
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Current feasibility score</div>
              <div className="mt-1">
                <span className={`rounded px-2 py-0.5 text-sm font-semibold ${FEASIBILITY_COLORS[score.category]}`}>
                  {score.score}/100 · {score.category}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{score.recommendations}</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <FieldArea
            label="Business idea"
            rows={4}
            value={form.businessIdea}
            onChange={(e) => setForm((f) => ({ ...f, businessIdea: e.target.value }))}
            required
          />
          <FieldArea
            label="Target market"
            rows={3}
            value={form.targetMarket}
            onChange={(e) => setForm((f) => ({ ...f, targetMarket: e.target.value }))}
            required
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              label="Startup costs (K)"
              type="number"
              min={1}
              step="any"
              value={form.startupCosts}
              onChange={(e) => setForm((f) => ({ ...f, startupCosts: e.target.value }))}
              required
            />
            <Field
              label="Revenue projection (K)"
              type="number"
              min={1}
              step="any"
              value={form.revenueProjection}
              onChange={(e) => setForm((f) => ({ ...f, revenueProjection: e.target.value }))}
              required
            />
            <Field
              label="Amount requested (K)"
              type="number"
              min={1}
              step="any"
              value={form.amountRequested}
              onChange={(e) => setForm((f) => ({ ...f, amountRequested: e.target.value }))}
              required
            />
          </div>

          <div className="text-xs text-slate-500">
            Requested {fmtZmk(Number(form.amountRequested) || 0)} · the feasibility score refreshes when you save.
          </div>

          {error && <ErrorNote message={error} />}
          {saved && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Plan updated and re-scored.
            </div>
          )}

          <PrimaryButton type="submit" loading={saving}>
            Save changes
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}