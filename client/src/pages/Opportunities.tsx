import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Opportunity } from '../lib/types';
import { fmtDate, fmtZmk } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Card, ErrorNote, Loading, PageHeader } from '../components/UI';

export default function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Opportunity[]>('/opportunities')
      .then(setOpportunities)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!opportunities) return <Loading />;

  const open = opportunities.filter((o) => new Date(o.deadline) >= new Date());
  const closed = opportunities.filter((o) => new Date(o.deadline) < new Date());

  return (
    <div>
      <PageHeader
        title="CDF Opportunities"
        subtitle="Constituency Development Fund opportunities open for applications."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {open.map((o) => (
          <Card key={o.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{o.constituencyName}</h2>
                <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {o.category}
                </span>
              </div>
              <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Open</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Pool: <span className="font-semibold text-slate-900">{fmtZmk(o.amountAvailable)}</span>
            </p>
            <p className="text-sm text-slate-600">
              Deadline: <span className="font-medium">{fmtDate(o.deadline)}</span>
            </p>
            <div className="mt-4">
              {user?.role === 'ADVISOR' ? (
                <span className="text-sm text-slate-500">Advisor accounts cannot apply for loans.</span>
              ) : (
                <Link
                  to={`/plans/new?opportunity=${o.id}`}
                  className="inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      window.location.href = `/login?next=/plans/new?opportunity=${encodeURIComponent(o.id)}`;
                    }
                  }}
                >
                  Start an application
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>

      {closed.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-700">Closed opportunities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {closed.map((o) => (
              <Card key={o.id} className="opacity-70">
                <h3 className="font-semibold text-slate-900">{o.constituencyName}</h3>
                <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {o.category}
                </span>
                <p className="mt-2 text-sm text-slate-600">{fmtZmk(o.amountAvailable)} · closed {fmtDate(o.deadline)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}