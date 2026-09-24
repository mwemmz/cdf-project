import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestLogin } from '../lib/auth';
import { Card, Field, PrimaryButton } from '../components/UI';

const TEST_ACCOUNTS = [
  { role: 'Admin', email: 'admin@fundpath.zm', password: 'Admin@123' },
  { role: 'Applicant', email: 'applicant@fundpath.zm', password: 'Applicant@123' },
  { role: 'Advisor', email: 'advisor1@fundpath.zm', password: 'Advisor@123' },
];

export default function Login() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestLogin(email, password);
      await refresh();
      const next = params.get('next');
      navigate(next ?? '/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Log in</h1>
        <p className="mt-1 text-sm text-slate-500">Access your FundPath account.</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <PrimaryButton type="submit" loading={loading} className="w-full">
            Log in
          </PrimaryButton>
        </form>
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Test accounts — click to fill</p>
          <ul className="mt-2 space-y-2">
            {TEST_ACCOUNTS.map((acc) => (
              <li key={acc.role} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-700">{acc.role}</p>
                  <p className="truncate text-xs text-slate-500">{acc.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                    setError(null);
                  }}
                  className="shrink-0 rounded-md border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          No account?{' '}
          <Link to="/register" className="text-brand-600 underline">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}