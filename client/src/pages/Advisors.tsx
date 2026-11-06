import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { AdvisorProfile } from '../lib/types';
import { fmtZmk } from '../lib/format';
import { SPECIALTY_LABELS } from '../lib/status';
import { Card, ErrorNote, Loading, PageHeader } from '../components/UI';
import { Stars } from '../components/Stars';

function initials(name: string | undefined) {
  return (name ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

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
        title="Advisors"
        subtitle="Verified advisors who help you shape a plan the CDF committee and bank can say yes to. Sessions are paid per booking."
      />

      {advisors.length === 0 && (
        <Card>
          <p className="text-slate-600">No verified advisors yet. Check back soon.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {advisors.map((a) => (
          <Card key={a.id} className="flex flex-col transition-shadow duration-200 hover:shadow-pop">
            <div className="flex items-start gap-3">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800"
                aria-hidden="true"
              >
                {initials(a.user?.name)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-slate-900">{a.user?.name}</h2>
                <span className="mt-1 inline-block rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {SPECIALTY_LABELS[a.specialty] ?? a.specialty}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold tnum text-slate-900">{fmtZmk(a.pricePerSession)}</div>
                <div className="text-xs text-slate-600">per session</div>
              </div>
            </div>

            <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{a.bio}</p>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              {a.rating && a.rating.count > 0 ? (
                <div className="flex items-center gap-1.5">
                  <Stars value={a.rating.average} />
                  <span className="whitespace-nowrap text-xs text-slate-600">
                    {a.rating.average.toFixed(1)} ({a.rating.count})
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-500">No reviews yet</span>
              )}
              <Link
                to={`/advisors/${a.id}`}
                className="shrink-0 whitespace-nowrap rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                View &amp; book
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
