import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { AdvisorProfile } from '../lib/types';
import { fmtZmk } from '../lib/format';
import { SPECIALTY_LABELS } from '../lib/status';
import { Card, ErrorNote, Loading, PageHeader } from '../components/UI';
import { Stars } from '../components/Stars';

export default function Advisors() {
  const [advisors, setAdvisors] = useState<AdvisorProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdvisorProfile[]>('/advisors')
      .then(setAdvisors)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!advisors) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Advisor Marketplace"
        subtitle="Verified advisors who can help you build and finance your business."
      />

      {advisors.length === 0 && (
        <Card>
          <p className="text-slate-500">No verified advisors yet. Check back soon.</p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {advisors.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{a.user?.name}</h2>
                <span className="mt-1 inline-block rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {SPECIALTY_LABELS[a.specialty] ?? a.specialty}
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-900">{fmtZmk(a.pricePerSession)}</div>
                <div className="text-xs text-slate-500">per session</div>
                {a.rating && a.rating.count > 0 && (
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <Stars value={a.rating.average} />
                    <span className="text-xs text-slate-500">({a.rating.count})</span>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600">{a.bio}</p>
            <div className="mt-4">
              <Link
                to={`/advisors/${a.id}`}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                View profile &amp; book
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}