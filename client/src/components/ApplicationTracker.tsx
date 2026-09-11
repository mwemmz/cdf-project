import type { ApplicationStatus } from '../lib/types';
import { APPLICATION_LABELS } from '../lib/status';

const PIPE: ApplicationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED', 'REPAYING', 'CLOSED'];

export function ApplicationTracker({ status }: { status: ApplicationStatus }) {
  if (status === 'REJECTED') {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
        <div className="text-sm font-semibold text-rose-700">Application rejected</div>
        <div className="mt-1 text-sm text-rose-600">
          This application did not progress. You can start a new plan against another opportunity.
        </div>
      </div>
    );
  }

  const currentIndex = PIPE.indexOf(status);
  const completed = status === 'CLOSED' ? PIPE.length : currentIndex + 1;

  return (
    <div>
      <div className="flex items-center gap-1">
        {PIPE.map((s, i) => {
          const done = i < completed;
          const isCurrent = i === currentIndex;
          return (
            <div key={s} className="flex flex-1 items-center" title={APPLICATION_LABELS[s]}>
              <div className="h-2 flex-1 rounded">
                <div
                  className={`h-2 rounded ${done ? 'bg-brand-500' : 'bg-slate-200'}`}
                  style={{ opacity: isCurrent && i > 0 ? 0.6 : 1 }}
                />
              </div>
              {i < PIPE.length - 1 && <div className="w-1" />}
            </div>
          );
        })}
      </div>
      <div className="mt-2 hidden justify-between text-xs text-slate-500 sm:flex">
        {PIPE.map((s, i) => (
          <span key={s} className={i === currentIndex ? 'font-semibold text-brand-700' : ''}>
            {APPLICATION_LABELS[s]}
          </span>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-500 sm:hidden">
        <span className="font-semibold text-brand-700">{APPLICATION_LABELS[status]}</span>
        <span className="text-slate-400">
          {' '}— Step {currentIndex + 1} of {PIPE.length}
        </span>
      </div>
    </div>
  );
}