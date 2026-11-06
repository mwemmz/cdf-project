import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import PageBackdrop from './PageBackdrop';

type NavItem = { to: string; label: string };

// Public pages everyone can reach. On desktop they live under one "Explore"
// menu so the role links (the daily-use ones) get the room.
const EXPLORE: NavItem[] = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/success-stories', label: 'Success stories' },
  { to: '/resources', label: 'Resources' },
];

const ROLE_LINKS: Record<string, NavItem[]> = {
  APPLICANT: [
    { to: '/plans', label: 'My plans' },
    { to: '/applications', label: 'Applications' },
    { to: '/advisors', label: 'Advisors' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/messages', label: 'Messages' },
    { to: '/receipts', label: 'Receipts' },
    { to: '/storefront', label: 'Storefront' },
  ],
  ADVISOR: [
    { to: '/advisor/dashboard', label: 'Dashboard' },
    { to: '/advisors/me', label: 'My profile' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/messages', label: 'Messages' },
    { to: '/receipts', label: 'Receipts' },
  ],
  ADMIN: [{ to: '/admin', label: 'Admin' }],
};

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
    isActive ? 'bg-white/[0.12] text-white' : 'text-white/80 hover:bg-white/[0.07] hover:text-white'
  }`;

const drawerLink = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
  }`;

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

const menuPanel =
  'absolute z-50 mt-2 min-w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-pop origin-top-left alert-enter';

function ExploreMenu() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const ref = useDismiss(open, () => setOpen(false));
  useEffect(() => setOpen(false), [pathname]);
  const active = EXPLORE.some((i) => pathname.startsWith(i.to));
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
          active || open ? 'bg-white/[0.12] text-white' : 'text-white/80 hover:bg-white/[0.07] hover:text-white'
        }`}
      >
        Explore <Chevron open={open} />
      </button>
      {open && (
        <div role="menu" className={`${menuPanel} left-0`}>
          {EXPLORE.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              role="menuitem"
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                  isActive ? 'font-semibold text-brand-700' : 'text-slate-700'
                }`
              }
            >
              {i.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  if (!user) return null;
  const initial = user.name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-copper-500 text-sm font-semibold text-white">
          {initial}
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div role="menu" className={`${menuPanel} right-0 origin-top-right`}>
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="max-w-56 truncate text-sm font-semibold text-slate-900">{user.name}</div>
            <div className="text-xs capitalize text-slate-600">{user.role.toLowerCase()}</div>
          </div>
          <button
            role="menuitem"
            onClick={onLogout}
            className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageKey = pathname.startsWith('/admin') ? 'admin' : pathname;
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleLinks = user ? ROLE_LINKS[user.role] ?? [] : [];

  const closeMobile = () => setMobileOpen(false);
  const handleLogout = () => {
    logout();
    closeMobile();
    navigate('/');
  };

  const scenePad = /^\/(login|register)/.test(pathname) ? 'pt-8 md:pt-12' : 'pt-8';

  return (
    <div className="flex min-h-screen flex-col">
      <PageBackdrop />
      <header className="print:hidden sticky top-0 z-40 border-t-2 border-copper-500 bg-brand-950 text-white shadow">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-xs font-bold text-white transition-transform group-hover:scale-105">
              FP
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">FundPath</span>
          </Link>

          {/* Desktop nav: collapses to the drawer below lg so it can never overflow */}
          <nav className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex" aria-label="Main">
            <ExploreMenu />
            {roleLinks.length > 0 && <span className="mx-2 h-5 w-px bg-white/15" aria-hidden="true" />}
            {roleLinks.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.to === '/advisors'} className={desktopLink}>
                {i.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
            {user ? (
              <>
                <NotificationBell />
                <AccountMenu onLogout={handleLogout} />
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-white/20 px-3.5 py-1.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-copper-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-copper-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            {user && <NotificationBell variant="mobile" />}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="flex items-center justify-center rounded-lg p-2 text-white/80 transition hover:bg-white/10"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'}
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobile} />}

      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-brand-950 shadow-xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4">
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="font-display text-lg font-semibold tracking-tight text-white">Menu</span>
            <button onClick={closeMobile} className="rounded-lg p-2 text-white/80 transition hover:text-white" aria-label="Close menu">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {roleLinks.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.to === '/advisors'} className={drawerLink} onClick={closeMobile}>
                {i.label}
              </NavLink>
            ))}
            {roleLinks.length > 0 && <div className="my-2 border-t border-white/10" />}
            <div className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">Explore</div>
            {EXPLORE.map((i) => (
              <NavLink key={i.to} to={i.to} className={drawerLink} onClick={closeMobile}>
                {i.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-4">
            {user ? (
              <div className="px-2">
                <div className="text-sm font-medium text-white">{user.name}</div>
                <div className="mb-3 text-xs capitalize text-white/80">{user.role.toLowerCase()}</div>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-2">
                <Link to="/login" onClick={closeMobile} className="rounded-lg border border-white/20 px-3 py-2 text-center text-sm text-white hover:bg-white/10">
                  Log in
                </Link>
                <Link to="/register" onClick={closeMobile} className="rounded-lg bg-copper-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-copper-700">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className={`mx-auto w-full max-w-6xl flex-1 px-4 pb-10 ${scenePad}`}>
        {/* Keyed so each page eases in; the admin area keys on itself so its sub-nav stays put. */}
        <div key={pageKey} className="page-enter">
          <Outlet />
        </div>
      </main>

      <footer className="print:hidden border-t-2 border-copper-500 bg-brand-950 py-6 text-center text-xs text-white/75">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-500" />
        FundPath — CDF loan-to-repayment platform for Zambia. School project build.
      </footer>
    </div>
  );
}
