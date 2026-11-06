import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [params] = useSearchParams();
  const wanted = params.get('thread');
  const [selected, setSelected] = useState<string | null>(wanted);
  const idOf = (c: Conversation) => (c.kind === 'product' ? c.threadId : c.bookingId) ?? '';

  useEffect(() => {
    const load = () =>
      api<Conversation[]>('/messages')
        .then((c) => {
          setConvos(c);
          setSelected((cur) => cur ?? (c[0] ? idOf(c[0]) : null));
        })
        .catch((err) => setError((err as Error).message));
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!convos) return <Loading />;

  const active = convos.find((c) => idOf(c) === selected) ?? null;

  return (
    <div>
      <PageHeader title="Messages" subtitle="Your conversations with advisors and marketplace sellers or buyers." />
      {convos.length === 0 ? (
        <Card>
          <p className="text-slate-600">
            No conversations yet.{' '}
            {user?.role === 'APPLICANT'
              ? 'Message a seller from the marketplace, or book an advisor and mark the session as paid to start chatting.'
              : 'Chats appear here once a client books and pays for a session.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[18rem_1fr]">
          <Card className="p-0">
            <ul className="divide-y divide-slate-100">
              {convos.map((c) => (
                <li key={idOf(c)}>
                  <button
                    onClick={() => setSelected(idOf(c))}
                    className={`block w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                      idOf(c) === selected ? 'bg-brand-50' : ''
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{c.other.name}</span>
                      <span className="shrink-0 text-[10px] text-slate-500">{fmtDateTime(c.updatedAt)}</span>
                    </div>
                    {c.kind === 'product' && (
                      <p className="mt-0.5 truncate text-[11px] font-medium text-brand-700">Re: {c.productName}</p>
                    )}
                    <p className="mt-0.5 truncate text-xs text-slate-600">
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
            {active && (
              <ChatThread
                key={idOf(active)}
                path={active.kind === 'product' ? `/messages/thread/${active.threadId}` : `/messages/${active.bookingId}`}
                otherName={active.other.name}
                topic={active.kind === 'product' ? active.productName : undefined}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
