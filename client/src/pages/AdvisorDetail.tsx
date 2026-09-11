import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { AdvisorProfile, Booking } from '../lib/types';
import { fmtZmk } from '../lib/format';
import { SPECIALTY_LABELS } from '../lib/status';
import { Card, ErrorNote, FieldArea, Loading, PrimaryButton } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function AdvisorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [advisor, setAdvisor] = useState<AdvisorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<AdvisorProfile>(`/advisors/${id}`)
      .then(setAdvisor)
      .catch((err) => setError((err as Error).message));
  }, [id]);

  const book = async (e: FormEvent) => {
    e.preventDefault();
    setBooking(true);
    setError(null);
    try {
      if (!advisor?.user) return;
      await api<Booking>('/bookings', {
        method: 'POST',
        body: { advisorId: advisor.user.id, note },
      });
      navigate('/bookings');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBooking(false);
    }
  };

  if (error) return <ErrorNote message={error} />;
  if (!advisor) return <Loading />;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{advisor.user?.name}</h1>
            <span className="mt-1 inline-block rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              {SPECIALTY_LABELS[advisor.specialty] ?? advisor.specialty}
            </span>
            <span className="ml-2 inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              Verified
            </span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900">{fmtZmk(advisor.pricePerSession)}</div>
            <div className="text-xs text-slate-500">per session</div>
          </div>
        </div>
        <p className="mt-4 whitespace-pre-line text-slate-700">{advisor.bio}</p>
        <p className="mt-3 text-sm text-slate-500">Contact: {advisor.user?.email}</p>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-900">Book a session</h2>

        {!user ? (
          <p className="mt-2 text-sm text-slate-600">
            <button onClick={() => navigate('/login')} className="font-medium text-brand-600 underline">
              Log in
            </button>{' '}
            as an applicant to book a session.
          </p>
        ) : user.role !== 'APPLICANT' ? (
          <p className="mt-2 text-sm text-slate-600">Only applicant accounts can book sessions.</p>
        ) : (
          <form onSubmit={book} className="mt-3 space-y-3">
            <FieldArea
              label="Message to the advisor (optional)"
              rows={3}
              placeholder="What do you want help with?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="text-sm text-slate-500">
              Session price: <span className="font-semibold text-slate-900">{fmtZmk(advisor.pricePerSession)}</span>{' '}
              — marked as paid by the mock payment step after booking.
            </div>
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
            )}
            <PrimaryButton type="submit" loading={booking}>
              Book session
            </PrimaryButton>
          </form>
        )}
      </Card>
    </div>
  );
}