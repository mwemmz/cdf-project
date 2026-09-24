import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { AdvisorClient, AdvisorClientsData } from '../lib/types';
import { APPLICATION_COLORS, APPLICATION_LABELS } from '../lib/status';
import { Card, ErrorNote, Loading, PageHeader, PrimaryButton } from '../components/UI';
import BreakEvenCalculator from '../components/BreakEvenCalculator';

function planStatusLabel(client: AdvisorClient): string {
  if (client.applicationStatus) return APPLICATION_LABELS[client.applicationStatus] ?? client.applicationStatus;
  if (client.planStatus === 'SCORED') return 'Scored · no application';
  if (client.planStatus === 'DRAFT') return 'Draft';
  return 'No plan yet';
}

export default function AdvisorDashboard() {
  const [data, setData] = useState<AdvisorClientsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    api<AdvisorClientsData>('/advisors/me/clients')
      .then(setData)
      .catch((err) => setError((err as Error).message));
  };

  useEffect(load, []);

  const link = async (planId: string) => {
    setBusyId(planId);
    setError(null);
    try {
      await api(`/business-plans/${planId}/advisor`, { method: 'POST' });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const unlink = async (planId: string) => {
    setBusyId(planId);
    setError(null);
    try {
      await api(`/business-plans/${planId}/advisor`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (error && !data) return <ErrorNote message={error} />;
  if (!data) return <Loading />;

  const { stats, clients } = data;

  const statCards = [
    { label: 'Active clients', value: String(stats.activeClients) },
    { label: 'Avg feasibility score', value: stats.averageFeasibilityScore ? `${stats.averageFeasibilityScore}` : '—' },
    { label: 'Sessions completed', value: String(stats.sessionsCompleted) },
    { label: 'Repeat bookings', value: String(stats.repeatBookings) },
  ];

  return (
    <div>
      <PageHeader
        title="Advisor dashboard"
        subtitle="Your clients, their plans, and a quick break-even tool."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="text-center">
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="mt-1 text-xs text-slate-500">{s.label}</div>
          </Card>
        ))}
      </div>

      {error && <div className="mt-4"><ErrorNote message={error} /></div>}

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-900">Clients ({stats.totalClients})</h2>
        {clients.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No clients have booked you yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3 font-medium">Client</th>
                  <th className="py-2 pr-3 font-medium">Plan status</th>
                  <th className="py-2 pr-3 font-medium">Score</th>
                  <th className="py-2 pr-3 font-medium">Sessions</th>
                  <th className="py-2 pr-3 font-medium">Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.applicant.id}>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-slate-900">{c.applicant.name}</div>
                      <div className="text-xs text-slate-400">{c.applicant.email}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          c.applicationStatus ? APPLICATION_COLORS[c.applicationStatus] : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {planStatusLabel(c)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-medium text-slate-700">
                      {c.feasibilityScore != null ? `${c.feasibilityScore}/100` : '—'}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      {c.sessionsCompleted}/{c.bookings}
                    </td>
                    <td className="py-3 pr-3">
                      {!c.planId ? (
                        <span className="text-xs text-slate-400">No plan</span>
                      ) : c.linkedToMe ? (
                        <span className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/advisor/plans/${c.planId}`}
                            className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                          >
                            Co-edit plan
                          </Link>
                          <button
                            onClick={() => unlink(c.planId!)}
                            disabled={busyId === c.planId}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                          >
                            Unlink
                          </button>
                        </span>
                      ) : (
                        <PrimaryButton
                          onClick={() => link(c.planId!)}
                          loading={busyId === c.planId}
                          className="text-xs"
                        >
                          Link &amp; co-edit
                        </PrimaryButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-4">
        <BreakEvenCalculator />
      </div>
    </div>
  );
}