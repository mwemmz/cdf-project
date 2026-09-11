import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestRegister } from '../lib/auth';
import { Card, Field, FieldSelect, PrimaryButton } from '../components/UI';

export default function Register() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'APPLICANT',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role as 'APPLICANT' | 'ADVISOR',
      });
      await refresh();
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Create an account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Advisors start unverified — your profile will be visible once verified.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          <Field label="Full name" value={form.name} onChange={set('name')} required autoComplete="name" />
          <Field label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
          <Field
            label="Password (min 8 characters)"
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="new-password"
          />
          <FieldSelect label="I am a…" value={form.role} onChange={set('role')}>
            <option value="APPLICANT">Applicant — applying for a CDF loan</option>
            <option value="ADVISOR">Advisor — offering sessions on the marketplace</option>
          </FieldSelect>
          <PrimaryButton type="submit" loading={loading} className="w-full">
            Register
          </PrimaryButton>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-brand-600 underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}