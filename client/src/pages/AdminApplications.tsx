import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmtDate, fmtZmk } from '../lib/format';
import type { ApplicationStatus } from '../lib/types';

interface QueueRow {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  amountDisbursed: number | null;
  applicant: { name: string; email: string };
  opportunity: { constituencyName: string; category: string };
  businessPlan: { amountRequested: number };
}

const stages: ApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'DISBURSED',
  'REPAYING',
  'CLOSED',
];

const stageLabels: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
  REPAYING: 'Repaying',
  CLOSED: 'Closed',
};

export default function AdminApplications() {
  const [rows, setRows] = useState<QueueRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const query = filter ? `?status=${encodeURIComponent(filter)}` : '';
    api<QueueRow[]>(`/admin/applications${query}`)
      .then(setRows)
      .catch((e: Error) => setError(e.message));
  }, [filter]);

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  }
  if (!rows) {
    return <div className="text-sm text-slate-500">Loading queue…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="stage-filter" className="text-sm font-medium text-slate-700">Filter by stage</label>
        <select
          id="stage-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        >
          <option value="">All stages</option>
          {stages.map((stage) => (
            <option key={stage} value={stage}>{stageLabels[stage]}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{rows.length} application{rows.length === 1 ? '' : 's'}</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No applications match this view.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Opportunity</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Disbursed</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.applicant.name}</p>
                    <p className="text-xs text-slate-500">{row.applicant.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.opportunity.constituencyName}
                    <span className="text-slate-400"> · {row.opportunity.category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{fmtZmk(row.businessPlan.amountRequested)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.amountDisbursed ? fmtZmk(row.amountDisbursed) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {stageLabels[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
