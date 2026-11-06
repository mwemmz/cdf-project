import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Txn, TransactionKind } from '../lib/types';
import { fmtDateTime, fmtMoney } from '../lib/format';
import { Card, ErrorNote, Loading } from '../components/UI';

export const KIND_LABEL: Record<TransactionKind, string> = {
  ADVISOR_SESSION: 'Advisor session',
  MARKETPLACE_SALE: 'Marketplace purchase',
  PLAN_ASSESSMENT: 'Plan & risk assessment',
};

const PROVIDER_LABEL: Record<string, string> = { MTN: 'MTN MoMo', AIRTEL: 'Airtel Money', ZAMTEL: 'Zamtel Kwacha' };

export function methodLabel(t: Txn): string {
  return t.method === 'MOBILE_MONEY' && t.provider
    ? `${PROVIDER_LABEL[t.provider] ?? t.provider} ${t.phoneMasked ?? ''}`.trim()
    : 'Simulated payment';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-2 text-sm last:border-0">
      <dt className="text-slate-600">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export default function Receipt() {
  const { id } = useParams();
  const [txn, setTxn] = useState<Txn | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Txn>(`/payments/${id}/receipt`)
      .then(setTxn)
      .catch((err) => setError((err as Error).message));
  }, [id]);

  if (error) return <ErrorNote message={error} />;
  if (!txn) return <Loading />;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card className="receipt bg-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold text-brand-700">FundPath</p>
            <p className="text-xs text-slate-500">Payment receipt (simulated)</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Paid</span>
        </div>
        <p className="mt-4 text-3xl font-bold text-slate-900">{fmtMoney(txn.grossAmount)}</p>
        <p className="text-sm text-slate-600">{txn.description}</p>
        <dl className="mt-4">
          <Row label="Receipt no." value={txn.receiptNo ?? txn.id} />
          <Row label="Date" value={fmtDateTime(txn.createdAt)} />
          <Row label="Type" value={KIND_LABEL[txn.kind]} />
          <Row label="Paid by" value={txn.payer.name} />
          <Row label="Paid to" value={txn.payee?.name ?? 'FundPath'} />
          <Row label="Method" value={methodLabel(txn)} />
          {txn.providerRef && <Row label="Network reference" value={txn.providerRef} />}
          {txn.payee && (
            <>
              <Row label={`FundPath fee (${Math.round(txn.commissionRate * 100)}%)`} value={fmtMoney(txn.commissionAmount)} />
              <Row label="Amount to recipient" value={fmtMoney(txn.netAmount)} />
            </>
          )}
        </dl>
        <p className="mt-4 text-xs text-slate-500">
          Demo receipt for a class project. No money moved and this is not a tax invoice.
        </p>
      </Card>
      <div className="no-print flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Print or save as PDF
        </button>
        <Link to="/receipts" className="glass rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-800">
          All receipts
        </Link>
      </div>
    </div>
  );
}
