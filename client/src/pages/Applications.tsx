import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Application } from '../lib/types';
import { fmtDate, fmtZmk } from '../lib/format';
import { APPLICATION_COLORS, APPLICATION_LABELS, FEASIBILITY_COLORS } from '../lib/status';
import { ApplicationTracker } from '../components/ApplicationTracker';
import { Card, ErrorNote, Loading, PageHeader } from '../components/UI';

export default function Applications() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Application[]>('/applications/mine')
      .then(setApplications)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!applications) return <Loading />;

  return (
    <div>
      <PageHeader title="My applications & loan tracking" subtitle="Follow each application through the pipeline." />

      {applications.length === 0 && (
        <Card>
          <p className="text-slate-500">
            No applications yet. Build a plan from an{' '}
            <Link to="/opportunities" className="font-medium text-brand-600 underline">
              opportunity
            </Link>{' '}
            and submit it.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {applications.map((app) => (
          <Card key={app.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">
                  {app.opportunity?.constituencyName} · {app.opportunity?.category}
                </div>
                <div className="text-sm text-slate-500">
                  Submitted {fmtDate(app.createdAt)} · requested {fmtZmk(app.businessPlan?.amountRequested ?? 0)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {app.businessPlan?.feasibilityScore && (
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      FEASIBILITY_COLORS[app.businessPlan.feasibilityScore.category]
                    }`}
                  >
                    Score {app.businessPlan.feasibilityScore.score}
                  </span>
                )}
                <span className={`rounded px-2 py-1 text-xs font-semibold ${APPLICATION_COLORS[app.status]}`}>
                  {APPLICATION_LABELS[app.status]}
                </span>
              </div>
            </div>

            <ApplicationTracker status={app.status} />

            <div className="mt-4">
              <Link to={`/applications/${app.id}`} className="text-sm font-medium text-brand-600 underline">
                View details &amp; repayments
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}