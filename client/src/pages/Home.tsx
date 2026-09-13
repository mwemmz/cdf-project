import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ICONS: Record<string, React.ReactNode> = {
  plan: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  advisor: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 21a7.5 7.5 0 0115 0m-7.5-9.75h3" />
    </svg>
  ),
  track: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  storefront: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
    </svg>
  ),
  cdf: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  score: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  ),
};

const FEATURES = [
  {
    key: 'plan',
    title: 'Build your business plan',
    body: 'A guided, multi-step builder that scores your plan for feasibility.',
  },
  {
    key: 'advisor',
    title: 'Work with verified advisors',
    body: 'Book one-on-one sessions on business plans, feasibility and accounting.',
  },
  {
    key: 'track',
    title: 'Track your loan',
    body: 'See your application pipeline, log repayments and watch your balance clear.',
  },
  {
    key: 'storefront',
    title: 'Open a storefront',
    body: 'Once disbursed, list products on the public marketplace.',
  },
  {
    key: 'cdf',
    title: 'Funded by CDF',
    body: 'Apply against constituency opportunities across Zambia.',
  },
  {
    key: 'score',
    title: 'Transparent scoring',
    body: 'Every plan gets a 0–100 feasibility score with recommendations.',
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="rounded-3xl bg-brand-950 p-8 text-white shadow-pop md:p-12">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            CDF loans, guided from idea to repayment
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
            FundPath connects applicants to Constituency Development Fund opportunities, helps
            them build business plans, pairs them with verified advisors, and tracks loans
            through disbursement and repayment.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/opportunities"
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
            >
              Browse opportunities
            </Link>
            <Link
              to="/marketplace"
              className="rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/40 hover:bg-white/10"
            >
              Shop the marketplace
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.key}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-pop"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
              {ICONS[f.key]}
            </div>
            <h3 className="mt-4 font-display font-semibold tracking-tight text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>

      {!user && (
        <section className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-6 md:p-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-brand-950">
                Start your application today
              </h2>
              <p className="mt-1 text-sm text-brand-800">
                Free to register — build a plan, apply for funding, and track every step.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Create an account
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:border-brand-300"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}