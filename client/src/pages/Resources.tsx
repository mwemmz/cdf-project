import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { Resource } from '../lib/types';
import { Card, ErrorNote, Loading, PageHeader } from '../components/UI';

export default function Resources() {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('All');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api<Resource[]>('/resources')
      .then(setResources)
      .catch((err) => setError((err as Error).message));
  }, []);

  const categories = useMemo(() => {
    if (!resources) return [];
    return ['All', ...Array.from(new Set(resources.map((r) => r.category)))];
  }, [resources]);

  if (error) return <ErrorNote message={error} />;
  if (!resources) return <Loading />;

  const visible = category === 'All' ? resources : resources.filter((r) => r.category === category);

  return (
    <div>
      <PageHeader
        title="Resource library"
        subtitle="Short, practical guides for CDF applicants and funded businesses."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              category === c
                ? 'bg-brand-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {visible.length === 0 && <Card><p className="text-slate-500">No resources in this category.</p></Card>}

      <div className="space-y-3">
        {visible.map((r) => {
          const open = openId === r.id;
          return (
            <Card key={r.id}>
              <button
                onClick={() => setOpenId(open ? null : r.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div>
                  <h2 className="font-semibold text-slate-900">{r.title}</h2>
                  <span className="mt-1 inline-block rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {r.category}
                  </span>
                </div>
                <span className="mt-1 shrink-0 text-slate-400">{open ? '−' : '+'}</span>
              </button>
              {open && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">{r.content}</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}