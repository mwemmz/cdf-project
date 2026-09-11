import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
  }[kind];
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

export function Loading() {
  return <div className="py-10 text-center text-sm text-slate-500">Loading…</div>;
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return <Alert kind="error">{message}</Alert>;
}

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
          error ? 'border-rose-400' : 'border-slate-300'
        }`}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function FieldArea({
  label,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        {...props}
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
          error ? 'border-rose-400' : 'border-slate-300'
        }`}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function FieldSelect({
  label,
  error,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        {...props}
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
          error ? 'border-rose-400' : 'border-slate-300'
        }`}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function PrimaryButton({
  children,
  loading = false,
  ...props
}: { children: ReactNode; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ''}`}
    >
      {loading ? 'Working…' : children}
    </button>
  );
}