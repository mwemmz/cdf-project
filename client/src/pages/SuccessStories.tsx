import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { SuccessStory } from '../lib/types';
import { fmtPct, fmtZmk } from '../lib/format';
import { APPLICATION_COLORS, APPLICATION_LABELS } from '../lib/status';
import { Card, ErrorNote, Loading, PageHeader } from '../components/UI';

export default function SuccessStories() {
  const [stories, setStories] = useState<SuccessStory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<SuccessStory[]>('/showcase')
      .then(setStories)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!stories) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Success stories"
        subtitle="Funded CDF businesses making their repayments. Loan → business → storefront → repayment."
      />

      {stories.length === 0 && (
        <Card>
          <p className="text-slate-500">
            No success stories yet — businesses appear here once they are repaying and at least 50% repaid.
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {stories.map((s) => (
          <Card key={s.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900">{s.applicantName}</h2>
                <p className="text-xs text-slate-500">
                  {s.constituency} · {s.category}
                </p>
              </div>
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${APPLICATION_COLORS[s.status]}`}>
                {APPLICATION_LABELS[s.status] ?? s.status}
              </span>
            </div>

            <p className="mt-3 flex-1 text-sm text-slate-600">{s.blurb}</p>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{fmtZmk(s.totalRepaid)} repaid of {fmtZmk(s.amountDisbursed)}</span>
                <span className="font-semibold text-brand-700">{fmtPct(s.repaymentPercentage)}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${Math.min(100, s.repaymentPercentage)}%` }}
                />
              </div>
            </div>

            {s.hasStorefront ? (
              <Link
                to={`/marketplace?seller=${s.applicantId}`}
                className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-700"
              >
                Visit storefront ({s.productCount} product{s.productCount === 1 ? '' : 's'})
              </Link>
            ) : (
              <p className="mt-4 text-xs text-slate-400">No storefront products listed yet.</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}