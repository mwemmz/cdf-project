import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="rounded-2xl bg-slate-900 p-8 text-white">
        <h1 className="text-3xl font-bold">CDF loans, guided from idea to repayment</h1>
        <p className="mt-3 max-w-2xl text-white/80">
          FundPath connects applicants to Constituency Development Fund opportunities, helps them
          build business plans, pairs them with verified advisors, and tracks loans through
          disbursement and repayment.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/opportunities"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium hover:bg-brand-600"
          >
            Browse opportunities
          </Link>
          <Link
            to="/marketplace"
            className="rounded-md border border-white/30 px-4 py-2 text-sm font-medium hover:bg-white/10"
          >
            Shop the marketplace
          </Link>
        </div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: 'Build your business plan',
            body: 'A guided, multi-step builder that scores your plan for feasibility.',
          },
          {
            title: 'Work with verified advisors',
            body: 'Book one-on-one sessions on business plans, feasibility and accounting.',
          },
          {
            title: 'Track your loan',
            body: 'See your application pipeline, log repayments and watch your balance clear.',
          },
          {
            title: 'Open a storefront',
            body: 'Once disbursed, list products on the public marketplace.',
          },
          {
            title: 'Funded by CDF',
            body: 'Apply against constituency opportunities across Zambia.',
          },
          {
            title: 'Transparent scoring',
            body: 'Every plan gets a 0-100 feasibility score with recommendations.',
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </div>

      {!user && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Create an account
          </Link>
          <Link to="/login" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-white">
            Log in
          </Link>
        </div>
      )}
    </div>
  );
}