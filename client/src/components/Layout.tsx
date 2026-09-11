import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
  }`;

const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
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
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="rounded bg-brand-500 px-2 py-1 text-sm font-bold text-white">FP</span>
            <span className="text-lg font-semibold">FundPath</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/marketplace" className={desktopNavLinkClass}>Marketplace</NavLink>
            <NavLink to="/opportunities" className={desktopNavLinkClass}>Opportunities</NavLink>
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
                <NavLink to="/advisors/me" className={desktopNavLinkClass}>My Profile</NavLink>
                <NavLink to="/bookings" className={desktopNavLinkClass}>Bookings</NavLink>
              </>
            )}
          </nav>

          {/* Desktop user info */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <div className="text-right">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-white/60">Logged in as {user.role.toLowerCase()}</div>
                </div>
                <button onClick={handleLogout} className="rounded-md border border-white/25 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-md border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10">Login</Link>
                <Link to="/register" className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium hover:bg-brand-600">Register</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex items-center justify-center rounded-md p-2 text-white/80 hover:bg-white/10 md:hidden"
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
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobile} />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-slate-900 shadow-xl transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4">
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="text-lg font-semibold text-white">Menu</span>
            <button onClick={closeMobile} className="rounded-md p-2 text-white/60 hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <NavLink to="/marketplace" className={navLinkClass} onClick={closeMobile}>Marketplace</NavLink>
            <NavLink to="/opportunities" className={navLinkClass} onClick={closeMobile}>Opportunities</NavLink>
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
                <NavLink to="/advisors/me" className={navLinkClass} onClick={closeMobile}>My Profile</NavLink>
                <NavLink to="/bookings" className={navLinkClass} onClick={closeMobile}>Bookings</NavLink>
              </>
            )}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-4">
            {user ? (
              <div className="px-2">
                <div className="text-sm font-medium text-white">{user.name}</div>
                <div className="mb-3 text-xs text-white/50">Logged in as {user.role.toLowerCase()}</div>
                <button onClick={handleLogout} className="w-full rounded-md border border-white/25 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-2">
                <Link to="/login" onClick={closeMobile} className="rounded-md border border-white/25 px-3 py-2 text-center text-sm hover:bg-white/10">Login</Link>
                <Link to="/register" onClick={closeMobile} className="rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-medium hover:bg-brand-600">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t bg-white py-4 text-center text-xs text-slate-400">
        FundPath — CDF loan-to-repayment platform for Zambia. School project build.
      </footer>
    </div>
  );
}
