import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmtDate, fmtZmk } from '../lib/format';

interface AdminAdvisor {
  id: string;
  specialty: string;
  bio: string;
  pricePerSession: number;
  verified: boolean;
  user: { id: string; name: string; email: string; createdAt: string };
}

export default function AdminAdvisors() {
  const [advisors, setAdvisors] = useState<AdminAdvisor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    api<AdminAdvisor[]>('/admin/advisors')
      .then((data) => {
        setAdvisors(data);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setVerification(advisor: AdminAdvisor, verified: boolean) {
    setBusyId(advisor.id);
    setActionError(null);
    try {
      await api(`/admin/advisors/${advisor.id}/verify`, { method: 'PATCH', body: { verified } });
      load();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  }
  if (!advisors) {
    return <div className="text-sm text-slate-500">Loading advisors…</div>;
  }

  const pending = advisors.filter((a) => !a.verified);
  const verified = advisors.filter((a) => a.verified);

  return (
    <div className="space-y-6">
      {actionError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError}</div>}

      <section>
        <h2 className="font-display text-base font-semibold text-slate-900">
          Awaiting verification <span className="text-slate-400">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No advisors are waiting. New sign-ups will appear here.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {pending.map((advisor) => (
              <AdvisorRow key={advisor.id} advisor={advisor} busyId={busyId} onSet={setVerification} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-base font-semibold text-slate-900">
          Verified <span className="text-slate-400">({verified.length})</span>
        </h2>
        <div className="mt-3 space-y-3">
          {verified.map((advisor) => (
            <AdvisorRow key={advisor.id} advisor={advisor} busyId={busyId} onSet={setVerification} />
          ))}
        </div>
      </section>
    </div>
  );
}

function AdvisorRow({
  advisor,
  busyId,
  onSet,
}: {
  advisor: AdminAdvisor;
  busyId: string | null;
  onSet: (advisor: AdminAdvisor, verified: boolean) => void;
}) {
  const busy = busyId === advisor.id;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">{advisor.user.name}</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                advisor.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {advisor.verified ? 'Verified' : 'Pending'}
            </span>
          </div>
          <p className="text-sm text-slate-500">{advisor.user.email}</p>
          <p className="mt-1 text-sm text-slate-600">
            {advisor.specialty} · {fmtZmk(advisor.pricePerSession)} ZMW per session · member since{' '}
            {fmtDate(advisor.user.createdAt)}
          </p>
          {advisor.bio && <p className="mt-1 max-w-2xl text-sm text-slate-600">{advisor.bio}</p>}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => onSet(advisor, !advisor.verified)}
          className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            advisor.verified
              ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          {advisor.verified ? 'Unverify' : 'Verify'}
        </button>
      </div>
    </div>
  );
}
