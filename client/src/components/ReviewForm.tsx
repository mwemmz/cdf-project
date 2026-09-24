import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import { StarInput } from './Stars';
import { ErrorNote, PrimaryButton } from './UI';

export default function ReviewForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      setError('Pick a star rating first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api('/reviews', { method: 'POST', body: { bookingId, rating, comment: comment.trim() || undefined } });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">Rate this session</p>
      <div className="mt-2">
        <StarInput value={rating} onChange={setRating} disabled={saving} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Optional comment — how was the session?"
        className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
      />
      {error && <div className="mt-2"><ErrorNote message={error} /></div>}
      <PrimaryButton type="submit" loading={saving} className="mt-3">
        Submit review
      </PrimaryButton>
    </form>
  );
}