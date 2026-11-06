import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { fmtZmk } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Card, ErrorNote, Loading, PageHeader, ProductImage } from '../components/UI';

export default function Marketplace() {
  const [params] = useSearchParams();
  const seller = params.get('seller');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bought, setBought] = useState<Record<string, string>>({});
  const [buyError, setBuyError] = useState<string | null>(null);

  const message = async (productId: string) => {
    setBuyError(null);
    try {
      const { threadId } = await api<{ threadId: string }>(`/messages/product/${productId}`, { method: 'POST' });
      navigate(`/messages?thread=${threadId}`);
    } catch (err) {
      setBuyError((err as Error).message);
    }
  };

  const buy = async (productId: string) => {
    setBuyError(null);
    try {
      await api('/payments/purchase', { method: 'POST', body: { productId, quantity: 1 } });
      setBought((b) => ({ ...b, [productId]: 'Purchased (simulated)' }));
    } catch (err) {
      setBuyError((err as Error).message);
    }
  };

  useEffect(() => {
    api<Product[]>('/products')
      .then(setProducts)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!products) return <Loading />;

  const visible = seller ? products.filter((p) => p.applicantId === seller) : products;
  const sellerName = seller ? products.find((p) => p.applicantId === seller)?.applicant?.name : null;

  return (
    <div>
      <PageHeader
        title="Marketplace"
        subtitle="Products from CDF-funded businesses across Zambia. Browse freely — no account needed."
      />

      {seller && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <span className="text-sm text-brand-800">
            Showing the storefront{sellerName ? ` for ${sellerName}` : ''} — {visible.length} product
            {visible.length === 1 ? '' : 's'}.
          </span>
          <Link to="/marketplace" className="text-sm font-medium text-brand-700 underline">
            View all
          </Link>
        </div>
      )}

      {buyError && <div className="mb-4"><ErrorNote message={buyError} /></div>}

      {visible.length === 0 && (
        <Card><p className="text-slate-600">No products on the marketplace yet. Check back soon.</p></Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <ProductImage name={p.name} src={p.imageUrl} className="mb-3 h-44 w-full rounded-lg object-cover" />
            <h2 className="font-semibold text-slate-900">{p.name}</h2>
            <p className="mt-1 flex-1 text-sm text-slate-600">{p.description}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="font-semibold text-slate-900">{fmtZmk(p.price)}</div>
              <div>
                {user?.id === p.applicantId ? (
                  <span className="text-xs text-slate-500">Your product</span>
                ) : user ? (
                  <button onClick={() => message(p.id)} className="text-sm font-medium text-brand-600 underline">
                    Message seller
                  </button>
                ) : (
                  <Link to="/login?next=/marketplace" className="text-sm font-medium text-brand-600 underline">
                    Sign in to message seller
                  </Link>
                )}
              </div>
            </div>
            {user && user.id !== p.applicantId && (
              <div className="mt-3">
                {bought[p.id] ? (
                  <span className="text-xs font-medium text-emerald-700">{bought[p.id]}</span>
                ) : (
                  <button
                    onClick={() => buy(p.id)}
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    Buy now (simulated)
                  </button>
                )}
              </div>
            )}
            <div className="mt-2 text-xs text-slate-500">Seller: {p.applicant?.name}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}