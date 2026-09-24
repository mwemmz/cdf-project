import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
  }`;

const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-t-2 border-copper-500 bg-brand-950 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-sm font-bold text-white shadow-inner transition-transform group-hover:scale-105">
              FP
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">FundPath</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/marketplace" className={desktopNavLinkClass}>Marketplace</NavLink>
            <NavLink to="/opportunities" className={desktopNavLinkClass}>Opportunities</NavLink>
            <NavLink to="/success-stories" className={desktopNavLinkClass}>Success Stories</NavLink>
            <NavLink to="/resources" className={desktopNavLinkClass}>Resources</NavLink>
            {user?.role === 'APPLICANT' && (
              <>
                <NavLink to="/plans" className={desktopNavLinkClass}>My Plans</NavLink>
                <NavLink to="/applications" className={desktopNavLinkClass}>My Applications</NavLink>
                <NavLink to="/advisors" className={desktopNavLinkClass}>Advisors</NavLink>
                <NavLink to="/bookings" className={desktopNavLinkClass}>Bookings</NavLink>
                <NavLink to="/storefront" className={desktopNavLinkClass}>Storefront</NavLink>
              </>
            )}
            {user?.role === 'ADVISOR' && (
              <>
                <NavLink to="/advisor/dashboard" className={desktopNavLinkClass}>Dashboard</NavLink>
                <NavLink to="/advisors/me" className={desktopNavLinkClass}>My Profile</NavLink>
                <NavLink to="/bookings" className={desktopNavLinkClass}>Bookings</NavLink>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={desktopNavLinkClass}>Admin</NavLink>
            )}
          </nav>

          {/* Desktop user info */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <NotificationBell />
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{user.name}</div>
                  <div className="text-xs text-white/40">Logged in as {user.role.toLowerCase()}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg border border-white/20 px-3.5 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
                  Log in
                </Link>
                <Link to="/register" className="rounded-lg bg-copper-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-copper-700">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex items-center justify-center rounded-lg p-2 text-white/80 transition hover:bg-white/10 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobile} />}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-brand-950 shadow-xl transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4">
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="font-display text-lg font-semibold tracking-tight text-white">Menu</span>
            <div className="flex items-center gap-1">
              <NotificationBell variant="mobile" />
              <button onClick={closeMobile} className="rounded-lg p-2 text-white/50 transition hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <NavLink to="/marketplace" className={navLinkClass} onClick={closeMobile}>Marketplace</NavLink>
            <NavLink to="/opportunities" className={navLinkClass} onClick={closeMobile}>Opportunities</NavLink>
            <NavLink to="/success-stories" className={navLinkClass} onClick={closeMobile}>Success Stories</NavLink>
            <NavLink to="/resources" className={navLinkClass} onClick={closeMobile}>Resources</NavLink>
            {user?.role === 'APPLICANT' && (
              <>
                <NavLink to="/plans" className={navLinkClass} onClick={closeMobile}>My Plans</NavLink>
                <NavLink to="/applications" className={navLinkClass} onClick={closeMobile}>My Applications</NavLink>
                <NavLink to="/advisors" className={navLinkClass} onClick={closeMobile}>Advisors</NavLink>
                <NavLink to="/bookings" className={navLinkClass} onClick={closeMobile}>Bookings</NavLink>
                <NavLink to="/storefront" className={navLinkClass} onClick={closeMobile}>Storefront</NavLink>
              </>
            )}
            {user?.role === 'ADVISOR' && (
              <>
                <NavLink to="/advisor/dashboard" className={navLinkClass} onClick={closeMobile}>Dashboard</NavLink>
                <NavLink to="/advisors/me" className={navLinkClass} onClick={closeMobile}>My Profile</NavLink>
                <NavLink to="/bookings" className={navLinkClass} onClick={closeMobile}>Bookings</NavLink>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={navLinkClass} onClick={closeMobile}>Admin</NavLink>
            )}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-4">
            {user ? (
              <div className="px-2">
                <div className="text-sm font-medium text-white">{user.name}</div>
                <div className="mb-3 text-xs text-white/40">Logged in as {user.role.toLowerCase()}</div>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-2">
                <Link to="/login" onClick={closeMobile} className="rounded-lg border border-white/20 px-3 py-2 text-center text-sm hover:bg-white/10">
                  Log in
                </Link>
                <Link to="/register" onClick={closeMobile} className="rounded-lg bg-copper-600 px-3 py-2 text-center text-sm font-semibold hover:bg-copper-700">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-500" />
        FundPath — CDF loan-to-repayment platform for Zambia. School project build.
      </footer>
    </div>
  );
}