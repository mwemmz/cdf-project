import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AdvisorProfile } from '../lib/types';
import { fmtZmk } from '../lib/format';
import { SPECIALTY_LABELS } from '../lib/status';
import { Card, ErrorNote, Field, FieldArea, FieldSelect, Loading, PageHeader, PrimaryButton } from '../components/UI';

export default function AdvisorMe() {
  const [profile, setProfile] = useState<AdvisorProfile | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ specialty: 'business_plans', bio: '', pricePerSession: '' });

  const load = () => {
    api<AdvisorProfile | null>('/advisors/me')
      .then((p) => {
        setProfile(p);
        if (p) setForm({ specialty: p.specialty, bio: p.bio, pricePerSession: String(p.pricePerSession) });
      })
      .catch((err) => setError((err as Error).message));
  };

  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api<AdvisorProfile>('/advisors/profile', {
        method: 'POST',
        body: {
          specialty: form.specialty,
          bio: form.bio,
          pricePerSession: Number(form.pricePerSession),
        },
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (profile === undefined) return error ? <ErrorNote message={error} /> : <Loading />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My advisor profile" subtitle="This is what applicants see on the marketplace." />

      {profile && (
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Current profile</div>
              <div className="mt-1 text-sm text-slate-600">
                {SPECIALTY_LABELS[profile.specialty] ?? profile.specialty} · {fmtZmk(profile.pricePerSession)}/session
              </div>
            </div>
            {profile.verified ? (
              <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">Verified</span>
            ) : (
              <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                Not verified — hidden from applicants
              </span>
            )}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold text-slate-900">{profile ? 'Update your profile' : 'Create your profile'}</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <FieldSelect
            label="Specialty"
            value={form.specialty}
            onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
          >
            <option value="business_plans">Business Plans</option>
            <option value="feasibility">Feasibility</option>
            <option value="accounting">Accounting</option>
            <option value="marketing">Marketing</option>
          </FieldSelect>
          <FieldArea
            label="Bio"
            rows={4}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Your experience, approach and who you help (at least 20 characters)."
          />
          <Field
            label="Price per session (K)"
            type="number"
            min={1}
            step="any"
            value={form.pricePerSession}
            onChange={(e) => setForm((f) => ({ ...f, pricePerSession: e.target.value }))}
            required
          />
          {error && <ErrorNote message={error} />}
          {saved && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Profile saved.
            </div>
          )}
          <PrimaryButton type="submit" loading={saving}>
            Save profile
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}