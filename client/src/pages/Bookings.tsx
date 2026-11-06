import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Booking } from '../lib/types';
import { fmtDateTime, fmtZmk } from '../lib/format';
import { BOOKING_COLORS, BOOKING_LABELS } from '../lib/status';
import { useAuth } from '../context/AuthContext';
import { Card, ErrorNote, Loading, PageHeader, PrimaryButton } from '../components/UI';
import ChatThread from '../components/ChatThread';
import MobileMoneyForm, { MomoPayment } from '../components/MobileMoneyForm';
import ReviewForm from '../components/ReviewForm';
import { Stars } from '../components/Stars';

const STATUS_ORDER: Record<string, number> = { PENDING: 0, PAID: 1, CANCELLED: 2 };
const GROUP_TITLES: Record<string, string> = { PENDING: 'Awaiting payment', PAID: 'Paid', CANCELLED: 'Cancelled' };

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Booking | null>(null);

  const load = () => {
    api<Booking[]>('/bookings/mine')
      .then(setBookings)
      .catch((err) => setError((err as Error).message));
  };

  useEffect(load, []);

  const payBooking = async (booking: Booking, payment: MomoPayment) => {
    const res = await api<{ receiptId?: string }>(`/bookings/${booking.id}/pay`, { method: 'POST', body: { payment } });
    load();
    return res.receiptId;
  };

  if (error) return <ErrorNote message={error} />;
  if (!bookings) return <Loading />;

  const isAdvisor = user?.role === 'ADVISOR';
  // Needs action first (pending), then paid, then cancelled; newest first inside each group.
  const sorted = [...bookings].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div>
      <PageHeader
        title="My bookings"
        subtitle={isAdvisor ? 'Sessions booked with you.' : 'Your advisor sessions.'}
      />

      {bookings.length === 0 && <Card><p className="text-slate-600">No bookings yet.</p></Card>}

      <div className="space-y-4">
        {sorted.map((b, i) => {
          const other = isAdvisor ? b.applicant : b.advisor;
          const specialty = isAdvisor ? null : b.advisor?.advisorProfile?.specialty ?? null;
          const startsGroup = i === 0 || sorted[i - 1].status !== b.status;
          return (
            <div key={b.id} className="space-y-4">
              {startsGroup && (
                <h2 className="glass inline-block rounded-full px-4 py-1.5 font-display text-sm font-semibold uppercase tracking-wide text-slate-700">
                  {GROUP_TITLES[b.status] ?? b.status} · {sorted.filter((x) => x.status === b.status).length}
                </h2>
              )}
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">
                    {other?.name}
                    {specialty ? ` — ${specialty.replace(/_/g, ' ')}` : ''}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {fmtZmk(b.price)} · booked {fmtDateTime(b.createdAt)}
                  </div>
                  {b.note && <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{b.note}</div>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${BOOKING_COLORS[b.status]}`}>
                    {BOOKING_LABELS[b.status]}
                  </span>
                  {b.status === 'PENDING' && (
                    <PrimaryButton onClick={() => setPayFor(b)} className="text-xs">
                      Pay with mobile money
                    </PrimaryButton>
                  )}
                </div>
              </div>
              {b.status === 'PAID' && <ChatThread path={`/messages/${b.id}`} otherName={other?.name ?? 'their account'} />}

              {b.status === 'PAID' && b.review && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">
                      {isAdvisor ? 'Client review' : 'Your review'}
                    </span>
                    <Stars value={b.review.rating} />
                  </div>
                  {b.review.comment && <p className="mt-2 text-sm text-slate-600">{b.review.comment}</p>}
                </div>
              )}

              {b.status === 'PAID' && !isAdvisor && !b.review && (
                <ReviewForm bookingId={b.id} onDone={load} />
              )}
            </Card>
            </div>
          );
        })}
      </div>
      {payFor && (
        <MobileMoneyForm
          title={`Advisor session with ${payFor.advisor?.name ?? 'your advisor'}`}
          amount={payFor.price}
          onPay={(payment) => payBooking(payFor, payment)}
          onClose={() => setPayFor(null)}
        />
      )}
    </div>
  );
}