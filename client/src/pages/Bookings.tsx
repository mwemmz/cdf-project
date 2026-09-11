import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Booking } from '../lib/types';
import { fmtDateTime, fmtZmk } from '../lib/format';
import { BOOKING_COLORS, BOOKING_LABELS } from '../lib/status';
import { useAuth } from '../context/AuthContext';
import { Card, ErrorNote, Loading, PageHeader, PrimaryButton } from '../components/UI';

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    api<Booking[]>('/bookings/mine')
      .then(setBookings)
      .catch((err) => setError((err as Error).message));
  };

  useEffect(load, []);

  const markPaid = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await api(`/bookings/${id}/pay`, { method: 'POST' });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorNote message={error} />;
  if (!bookings) return <Loading />;

  const isAdvisor = user?.role === 'ADVISOR';

  return (
    <div>
      <PageHeader
        title="My bookings"
        subtitle={isAdvisor ? 'Sessions booked with you.' : 'Your advisor sessions.'}
      />

      {bookings.length === 0 && <Card><p className="text-slate-500">No bookings yet.</p></Card>}

      <div className="space-y-4">
        {bookings.map((b) => {
          const other = isAdvisor ? b.applicant : b.advisor;
          const specialty = isAdvisor ? null : b.advisor?.advisorProfile?.specialty ?? null;
          return (
            <Card key={b.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">
                    {other?.name}
                    {specialty ? ` — ${specialty.replace(/_/g, ' ')}` : ''}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {fmtZmk(b.price)} · booked {fmtDateTime(b.createdAt)}
                  </div>
                  {b.note && <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{b.note}</div>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${BOOKING_COLORS[b.status]}`}>
                    {BOOKING_LABELS[b.status]}
                  </span>
                  {b.status === 'PENDING' && (
                    <PrimaryButton onClick={() => markPaid(b.id)} loading={busyId === b.id} className="text-xs">
                      Mark as paid
                    </PrimaryButton>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}