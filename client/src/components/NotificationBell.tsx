import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { AppNotification } from '../lib/types';
import { fmtDateTime } from '../lib/format';

const POLL_MS = 30000;

const TYPE_DOT: Record<string, string> = {
  FEASIBILITY_READY: 'bg-emerald-500',
  NEW_MESSAGE: 'bg-sky-500',
  REPAYMENT_DUE: 'bg-amber-500',
  APPLICATION_STATUS: 'bg-brand-500',
  NEW_REVIEW: 'bg-copper-500',
};

export default function NotificationBell({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = () => {
    api<AppNotification[]>('/notifications')
      .then(setItems)
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await api(`/notifications/${id}/read`, { method: 'POST' }).catch(() => load());
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await api('/notifications/read-all', { method: 'POST' }).catch(() => load());
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="relative rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-copper-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop ${
            variant === 'mobile' ? 'right-0' : 'right-0'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-medium text-brand-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">Nothing here yet.</p>}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 ${
                  n.read ? 'opacity-60' : ''
                }`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[n.type] ?? 'bg-slate-400'}`} />
                <span className="min-w-0">
                  <span className="block text-sm text-slate-700">{n.message}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}