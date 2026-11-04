import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

const fieldBase =
  'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

export type HeaderImage = {
  src: string;
  alt: string;
  /** banner: heading sits on the picture. strip: heading above, picture below. */
  mode?: 'banner' | 'strip';
  /** CSS object-position, e.g. "50% 60%" */
  pos?: string;
};

export function PageHeader({
  title,
  subtitle,
  action,
  image,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  image?: HeaderImage;
}) {
  if (image && image.mode === 'banner') {
    return (
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 shadow-card">
        <img src={image.src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: image.pos ?? 'right center' }} />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#f1e7d6] via-[#f1e7d6]/80 to-transparent md:via-[#f1e7d6]/50" />
        <div className="relative flex min-h-[200px] items-center justify-between gap-4 p-6 md:min-h-[240px] md:p-10">
          <div className="min-w-0 max-w-md">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-700">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    );
  }
  return (
    <>
      <div className={`${image ? 'mb-4' : 'mb-6'} flex items-start justify-between gap-4`}>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {image && (
        <img
          src={image.src}
          alt={image.alt}
          className="mb-6 h-40 w-full rounded-2xl border border-slate-200 object-cover shadow-card md:h-56"
          style={{ objectPosition: image.pos ?? 'center' }}
        />
      )}
    </>
  );
}

/** Two-column shell for Login and Register: picture on the left (large screens), form on the right. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-4xl items-stretch gap-6 lg:grid-cols-2">
      <div
        role="img"
        aria-label="A locked safe with a green key on top"
        className="hidden min-h-[420px] rounded-2xl bg-cover shadow-card lg:block"
        style={{ backgroundImage: "url('/images/vault-key.webp')", backgroundPosition: '50% 50%' }}
      />
      <div className="mx-auto w-full max-w-md self-center">{children}</div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-card ${className}`}>{children}</div>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  }[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`alert-enter rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200"
        style={{ borderTopColor: '#178158' }}
      />
      Loading…
    </div>
  );
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className={`${fieldBase} ${
          error
            ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        {...props}
        className={`${fieldBase} ${
          error
            ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <select
        {...props}
        className={`${fieldBase} ${
          error
            ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
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
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-brand-600 ${
        props.className ?? ''
      }`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40"
          style={{ borderTopColor: '#ffffff' }}
        />
      )}
      {loading ? 'Working…' : children}
    </button>
  );
}

const PLACEHOLDERS: Record<string, string> = {
  poultry: '/placeholders/poultry.svg',
  feed: '/placeholders/feed.svg',
  eggs: '/placeholders/eggs.svg',
  vegetables: '/placeholders/vegetables.svg',
  honey: '/placeholders/honey.svg',
  bakery: '/placeholders/bakery.svg',
  crafts: '/placeholders/crafts.svg',
  tailoring: '/placeholders/tailoring.svg',
  retail: '/placeholders/retail.svg',
  livestock: '/placeholders/livestock.svg',
};

export function placeholderFor(name: string): string {
  const key = Object.keys(PLACEHOLDERS).find((k) => name.toLowerCase().includes(k));
  return key ? PLACEHOLDERS[key] : '/placeholders/product.svg';
}

export function ProductImage({
  name,
  src,
  className = '',
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const fallback = placeholderFor(name);
  return (
    <img
      src={src ?? fallback}
      alt={name}
      loading="lazy"
      className={className}
      onError={(e) => {
        const el = e.currentTarget;
        if (el.getAttribute('src') !== fallback) el.src = fallback;
      }}
    />
  );
}