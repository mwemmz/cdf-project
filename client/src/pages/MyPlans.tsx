import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { BusinessPlan } from '../lib/types';
import { fmtDate, fmtZmk } from '../lib/format';
import { APPLICATION_LABELS, FEASIBILITY_COLORS } from '../lib/status';
import { Card, ErrorNote, Loading, PageHeader } from '../components/UI';

export default function MyPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<BusinessPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<BusinessPlan[]>('/business-plans/mine')
      .then(setPlans)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!plans) return <Loading />;

  return (
    <div>
      <PageHeader
        title="My Business Plans"
        subtitle="Plans you have built with their feasibility scores."
        action={
          <Link to="/opportunities" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            New plan
          </Link>
        }
      />

      {plans.length === 0 && (
        <Card>
          <p className="text-slate-500">
            You haven't built a plan yet.{' '}
            <button onClick={() => navigate('/opportunities')} className="font-medium text-brand-600 underline">
              Start one from an opportunity
            </button>
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-slate-900">{p.businessIdea}</h2>
                <p className="text-sm text-slate-500">
                  {p.opportunity?.constituencyName} · created {fmtDate(p.createdAt)}
                </p>
              </div>
              {p.feasibilityScore && (
                <span
                  className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${
                    FEASIBILITY_COLORS[p.feasibilityScore.category]
                  }`}
                >
                  {p.feasibilityScore.score}/100
                </span>
              )}
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs sm:text-sm">
              <div>
                <dt className="text-xs text-slate-400">Requested</dt>
                <dd className="font-medium">{fmtZmk(p.amountRequested)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Startup</dt>
                <dd className="font-medium">{fmtZmk(p.startupCosts)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Revenue</dt>
                <dd className="font-medium">{fmtZmk(p.revenueProjection)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between">
              <Link to={`/plans/${p.id}`} className="text-sm font-medium text-brand-600 underline">
                View summary
              </Link>
              {p.application && (
                <span className="text-xs text-slate-500">
                  Application: <span className="font-medium">{APPLICATION_LABELS[p.application.status]}</span>
                </span>
              )}
              {p.feasibilityScore && !p.application && (
                <Link to="/applications" className="text-sm font-medium text-brand-600 underline">
                  Submit as application →
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}