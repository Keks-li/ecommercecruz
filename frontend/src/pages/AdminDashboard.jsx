import { useState } from 'react';
import AdminLogin from './AdminLogin';
import OverviewTab from '../components/admin/OverviewTab';
import ProductsTab from '../components/admin/ProductsTab';
import OrdersTab from '../components/admin/OrdersTab';
import AdminPanel from './AdminPanel';

// ─── Icons ────────────────────────────────────────────────────────────────────
const ChartIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>;
const PackageIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const ShoppingBagIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const UsersIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const LogoutIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!raw || !token) return null;
    const user = JSON.parse(raw);
    return user?.role === 'ADMIN' ? user : null;
  } catch {
    return null;
  }
}

export default function AdminDashboard() {
  const [user, setUser] = useState(getStoredUser);
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogin = (loggedInUser) => setUser(loggedInUser);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // ── Not logged in → show login screen ──────────────────────────────────────
  if (!user) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // ── Logged in → show dashboard ─────────────────────────────────────────────
  const navItems = [
    { id: 'overview',   label: 'Overview',   icon: ChartIcon },
    { id: 'products',   label: 'Products',   icon: PackageIcon },
    { id: 'orders',     label: 'Orders',     icon: ShoppingBagIcon },
    { id: 'customers',  label: 'Customers',  icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-sans flex flex-col md:flex-row">

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800 shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-600/10 text-indigo-400'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
              {user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 text-xs font-semibold truncate">{user.email}</p>
              <p className="text-indigo-400 text-xs">Administrator</p>
            </div>
          </div>
          <button
            id="admin-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-sm font-medium"
          >
            <LogoutIcon />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview'  && <OverviewTab />}
          {activeTab === 'products'  && <ProductsTab />}
          {activeTab === 'orders'    && <OrdersTab />}
          {activeTab === 'customers' && <AdminPanel />}
        </div>
      </main>
    </div>
  );
}
