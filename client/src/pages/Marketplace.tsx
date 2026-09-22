import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { fmtZmk } from '../lib/format';
import { Card, ErrorNote, Loading, PageHeader, ProductImage } from '../components/UI';

export default function Marketplace() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api<Product[]>('/products')
      .then(setProducts)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!products) return <Loading />;

  const toggle = (id: string) => setRevealed((r) => ({ ...r, [id]: !r[id] }));

  return (
    <div>
      <PageHeader
        title="Marketplace"
        subtitle="Products from CDF-funded businesses across Zambia. Browse freely — no account needed."
      />

      {products.length === 0 && (
        <Card><p className="text-slate-500">No products on the marketplace yet. Check back soon.</p></Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <ProductImage name={p.name} src={p.imageUrl} className="mb-3 h-44 w-full rounded-lg object-cover" />
            <h2 className="font-semibold text-slate-900">{p.name}</h2>
            <p className="mt-1 flex-1 text-sm text-slate-600">{p.description}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="font-semibold text-slate-900">{fmtZmk(p.price)}</div>
              <div>
                {revealed[p.id] ? (
                  <a
                    href={`mailto:${p.applicant?.email ?? ''}?subject=Interested in ${encodeURIComponent(p.name)}`}
                    className="text-sm font-medium text-emerald-700 underline"
                  >
                    {p.applicant?.email}
                  </a>
                ) : (
                  <button onClick={() => toggle(p.id)} className="text-sm font-medium text-brand-600 underline">
                    Interested? Contact seller
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-400">Seller: {p.applicant?.name}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}