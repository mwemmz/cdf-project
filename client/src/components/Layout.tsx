import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="rounded bg-brand-500 px-2 py-1 text-sm font-bold text-white">FP</span>
            <span className="text-lg font-semibold">FundPath</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/marketplace" className={navLinkClass}>
              Marketplace
            </NavLink>
            <NavLink to="/opportunities" className={navLinkClass}>
              Opportunities
            </NavLink>
            {user?.role === 'APPLICANT' && (
              <>
                <NavLink to="/plans" className={navLinkClass}>
                  My Plans
                </NavLink>
                <NavLink to="/applications" className={navLinkClass}>
                  My Applications
                </NavLink>
                <NavLink to="/advisors" className={navLinkClass}>
                  Advisors
                </NavLink>
                <NavLink to="/bookings" className={navLinkClass}>
                  Bookings
                </NavLink>
                <NavLink to="/storefront" className={navLinkClass}>
                  Storefront
                </NavLink>
              </>
            )}
            {user?.role === 'ADVISOR' && (
              <>
                <NavLink to="/advisors/me" className={navLinkClass}>
                  My Profile
                </NavLink>
                <NavLink to="/bookings" className={navLinkClass}>
                  Bookings
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="text-right">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-white/60">Logged in as {user.role.toLowerCase()}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-white/25 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-md border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10">
                  Login
                </Link>
                <Link to="/register" className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium hover:bg-brand-600">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t bg-white py-4 text-center text-xs text-slate-400">
        FundPath — CDF loan-to-repayment platform for Zambia. School project build.
      </footer>
    </div>
  );
}