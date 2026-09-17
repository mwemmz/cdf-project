import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/applications', label: 'Applications', end: false },
  { to: '/admin/advisors', label: 'Advisors', end: false },
  { to: '/admin/opportunities', label: 'Opportunities', end: false },
];

export default function AdminLayout() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Admin</h1>
        <p className="text-sm text-slate-500">Platform administration</p>
      </div>

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
