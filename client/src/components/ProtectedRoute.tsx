import { ReactNode } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../lib/types';

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, loaded } = useAuth();
  const location = useLocation();

  if (!loaded) {
    return <div className="p-8 text-center text-slate-500">Loading…</div>;
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="mb-4 text-slate-600">This page is only available to{' '}
          {roles.join(' / ').toLowerCase()} accounts.</p>
        <Link to="/" className="text-brand-600 underline">
          Back to home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}