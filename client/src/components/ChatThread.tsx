import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { Message } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { fmtTime } from '../lib/format';
import { PrimaryButton } from './UI';

const POLL_MS = 4000;

export default function ChatThread({ bookingId, otherName }: { bookingId: string; otherName: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    api<Message[]>(`/messages/${bookingId}`)
      .then(setMessages)
      .catch((err) => setError((err as Error).message));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api(`/messages/${bookingId}`, { method: 'POST', body: { content: draft.trim() } });
      setDraft('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <p className="text-sm font-semibold text-slate-800">Chat with {otherName}</p>
        <p className="text-xs text-slate-400">Live chat refreshes automatically</p>
      </div>

      <div className="max-h-72 min-h-28 space-y-2.5 overflow-y-auto px-4 py-3">
        {!messages && <p className="mt-3 text-center text-xs text-slate-400">Loading messages…</p>}
        {messages?.length === 0 && <p className="mt-3 text-center text-sm text-slate-400">No messages yet — say hello.</p>}
        {messages?.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                  mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                }`}
              >
                {!mine && <div className="mb-0.5 text-xs font-medium text-brand-700">{m.sender?.name}</div>}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <div className={`mt-1 text-right text-[10px] ${mine ? 'text-white/60' : 'text-slate-400'}`}>
                  {fmtTime(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 pb-2 text-xs text-rose-600">{error}</p>}

      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
        <PrimaryButton type="submit" loading={sending} disabled={!draft.trim()} className="shrink-0">
          Send
        </PrimaryButton>
      </form>
    </div>
  );
}