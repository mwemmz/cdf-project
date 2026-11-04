import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Conversation } from '../lib/types';
import { fmtDateTime } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Card, ErrorNote, Loading, PageHeader } from '../components/UI';
import ChatThread from '../components/ChatThread';

export default function Messages() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      api<Conversation[]>('/messages')
        .then((c) => {
          setConvos(c);
          setSelected((cur) => cur ?? c[0]?.bookingId ?? null);
        })
        .catch((err) => setError((err as Error).message));
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!convos) return <Loading />;

  const active = convos.find((c) => c.bookingId === selected) ?? null;

  return (
    <div>
      <PageHeader
        image={{ src: '/images/advisors.webp', pos: '50% 65%' }} title="Messages" subtitle="Your conversations. A chat opens once a session is paid." />
      {convos.length === 0 ? (
        <Card>
          <p className="text-slate-500">
            No conversations yet.{' '}
            {user?.role === 'APPLICANT'
              ? 'Book an advisor and mark the session as paid to start chatting.'
              : 'Chats appear here once a client books and pays for a session.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
          <Card className="p-0">
            <ul className="divide-y divide-slate-100">
              {convos.map((c) => (
                <li key={c.bookingId}>
                  <button
                    onClick={() => setSelected(c.bookingId)}
                    className={`block w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                      c.bookingId === selected ? 'bg-brand-50' : ''
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{c.other.name}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{fmtDateTime(c.updatedAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {c.lastMessage
                        ? `${c.lastMessage.senderId === user?.id ? 'You: ' : ''}${c.lastMessage.content}`
                        : 'No messages yet'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <div>
            {active && <ChatThread key={active.bookingId} bookingId={active.bookingId} otherName={active.other.name} />}
          </div>
        </div>
      )}
    </div>
  );
}
