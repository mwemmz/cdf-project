import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Txn } from '../lib/types';
import { fmtDateTime, fmtMoney } from '../lib/format';
import { Card, ErrorNote, Loading, PageHeader } from '../components/UI';
import { KIND_LABEL } from './Receipt';

export default function Receipts() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Txn[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Txn[]>('/payments/mine')
      .then(setRows)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!rows) return <Loading />;

  return (
    <div>
      <PageHeader title="Receipts" subtitle="Every payment you made or received on FundPath." />
      {rows.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-700">No payments yet. Book an advisor, buy a product or pay for a plan assessment and the receipt will appear here.</p>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {rows.map((t) => {
            const received = t.payee?.id === user?.id;
            return (
              <li key={t.id}>
                <Link to={`/receipts/${t.id}`} className="block">
                  <Card className="transition hover:bg-white/90">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{t.description}</p>
                        <p className="text-xs text-slate-600">
                          {KIND_LABEL[t.kind]} · {fmtDateTime(t.createdAt)} · {t.receiptNo ?? t.id}
                        </p>
                      </div>
                      <p className={`shrink-0 text-sm font-bold ${received ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {received ? `+${fmtMoney(t.netAmount)}` : `−${fmtMoney(t.grossAmount)}`}
                      </p>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
