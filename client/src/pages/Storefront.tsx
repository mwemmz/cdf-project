import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { fmtZmk } from '../lib/format';
import { Card, ErrorNote, Field, FieldArea, Loading, PageHeader, PrimaryButton } from '../components/UI';

interface UpsertForm {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
}

const emptyForm: UpsertForm = { name: '', description: '', price: '', imageUrl: '' };

export default function Storefront() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [modal, setModal] = useState<{ product: Product | null } | null>(null);
  const [form, setForm] = useState<UpsertForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api<Product[]>('/products/mine')
      .then(setProducts)
      .catch((err) => setError((err as Error).message));
  };

  useEffect(load, []);

  const openNew = () => {
    setForm(emptyForm);
    setError(null);
    setModal({ product: null });
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl ?? '',
    });
    setError(null);
    setModal({ product });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl: form.imageUrl,
      };
      if (modal?.product) {
        await api(`/products/${modal.product.id}`, { method: 'PATCH', body: payload });
        setNotice('Product updated.');
      } else {
        await api('/products', { method: 'POST', body: payload });
        setNotice('Product created — it is now live on the marketplace.');
      }
      setModal(null);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await api(`/products/${product.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (error && !products) return <ErrorNote message={error} />;
  if (!products) return <Loading />;

  return (
    <div>
      <PageHeader
        title="My storefront"
        subtitle="Sell products once your application is disbursed. Listings appear on the public marketplace."
        action={
          <PrimaryButton onClick={openNew}>Add product</PrimaryButton>
        }
      />

      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {products.length === 0 && (
        <Card>
          <p className="text-slate-500">No products yet. Click "Add product" to create your first listing.</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id}>
            {p.imageUrl && (
              <img src={p.imageUrl} alt={p.name} className="mb-3 h-40 w-full rounded-lg object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            )}
            <h2 className="font-semibold text-slate-900">{p.name}</h2>
            <p className="mt-1 text-sm text-slate-600 line-clamp-3">{p.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="font-semibold text-slate-900">{fmtZmk(p.price)}</div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="text-sm font-medium text-brand-600 underline">
                  Edit
                </button>
                <button onClick={() => remove(p)} className="text-sm font-medium text-rose-600 underline">
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900">
              {modal.product ? 'Edit product' : 'New product'}
            </h2>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <Field label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <FieldArea
                label="Description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Price (K)"
                  type="number"
                  min={1}
                  step="any"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
                <Field
                  label="Image URL (optional)"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
              {error && <ErrorNote message={error} />}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">
                  Cancel
                </button>
                <PrimaryButton type="submit" loading={saving}>
                  {modal.product ? 'Save changes' : 'Create product'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}