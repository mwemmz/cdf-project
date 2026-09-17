import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmtDate, fmtZmk } from '../lib/format';

interface Opportunity {
  id: string;
  constituencyName: string;
  category: string;
  amountAvailable: number;
  deadline: string;
}

const emptyForm = { constituencyName: '', category: '', amountAvailable: '', deadline: '' };

export default function AdminOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setOpportunities(await api<Opportunity[]>('/opportunities'));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function beginEdit(o: Opportunity) {
    setEditingId(o.id);
    setForm({
      constituencyName: o.constituencyName,
      category: o.category,
      amountAvailable: String(o.amountAvailable),
      deadline: o.deadline.slice(0, 10),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const body = {
        constituencyName: form.constituencyName,
        category: form.category,
        amountAvailable: Number(form.amountAvailable),
        deadline: form.deadline,
      };
      if (editingId) {
        await api(`/admin/opportunities/${editingId}`, { method: 'PATCH', body });
      } else {
        await api('/admin/opportunities', { method: 'POST', body });
      }
      resetForm();
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-base font-semibold text-slate-900">
          {editingId ? 'Edit opportunity' : 'New opportunity'}
        </h2>
        {formError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            required
            placeholder="Constituency"
            value={form.constituencyName}
            onChange={(e) => setForm({ ...form, constituencyName: e.target.value })}
            className={inputClass}
          />
          <input
            required
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={inputClass}
          />
          <input
            required
            type="number"
            min="1"
            step="any"
            placeholder="Amount (ZMW)"
            value={form.amountAvailable}
            onChange={(e) => setForm({ ...form, amountAvailable: e.target.value })}
            className={inputClass}
          />
          <input
            required
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className={inputClass}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {editingId ? 'Save' : 'Create'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Constituency</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {opportunities.map((o) => (
              <tr key={o.id} className={editingId === o.id ? 'bg-brand-50/50' : undefined}>
                <td className="px-4 py-3 font-medium text-slate-900">{o.constituencyName}</td>
                <td className="px-4 py-3 text-slate-600">{o.category}</td>
                <td className="px-4 py-3 text-slate-600">{fmtZmk(o.amountAvailable)}</td>
                <td className="px-4 py-3 text-slate-600">{fmtDate(o.deadline)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => beginEdit(o)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
