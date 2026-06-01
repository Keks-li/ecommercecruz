import { useState } from 'react';
import AdminLogin from './AdminLogin';
import OverviewTab from '../components/admin/OverviewTab';
import ProductsTab from '../components/admin/ProductsTab';
import OrdersTab from '../components/admin/OrdersTab';
import OverdueTab from '../components/admin/OverdueTab';
import PaymentRulesTab from '../components/admin/PaymentRulesTab';
import CancellationsTab from '../components/admin/CancellationsTab';
import AuditLogTab from '../components/admin/AuditLogTab';
import AdminPanel from './AdminPanel';

// ─── Icons ────────────────────────────────────────────────────────────────────
const ChartIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>;
const PackageIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const BagIcon      = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const UsersIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const AlertIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>;
const SettingsIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.7"/><path d="M17.7 21.4a1 1 0 0 1-1.4 0l-.7-.7a4 4 0 0 1-1.1 0l-.7.7a1 1 0 0 1-1.4 0l-.7-.7a4 4 0 0 1-.8-1.4l-.7-.7a1 1 0 0 1 0-1.4l.7-.7a4 4 0 0 1 0-1.1l-.7-.7a1 1 0 0 1 0-1.4l.7-.7a4 4 0 0 1 1.4-.8l.7-.7a1 1 0 0 1 1.4 0l.7.7a4 4 0 0 1 1.1 0l.7-.7a1 1 0 0 1 1.4 0l.7.7a4 4 0 0 1 .8 1.4l.7.7a1 1 0 0 1 0 1.4l-.7.7a4 4 0 0 1 0 1.1l.7.7a1 1 0 0 1 0 1.4l-.7.7"/><circle cx="18" cy="18" r="2"/></svg>;
const XIcon        = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const HistoryIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
const LogoutIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!raw || !token) return null;
    const user = JSON.parse(raw);
    return user?.role === 'ADMIN' ? user : null;
  } catch { return null; }
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'overview',   label: 'Dashboard',    icon: ChartIcon },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { id: 'products',   label: 'Products',     icon: PackageIcon },
    ],
  },
  {
    label: 'Orders',
    items: [
      { id: 'orders',     label: 'All Orders',   icon: BagIcon },
      { id: 'overdue',    label: 'Overdue',      icon: AlertIcon },
      { id: 'cancellations', label: 'Cancellations', icon: XIcon },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'payment-rules', label: 'Payment Rules', icon: SettingsIcon },
      { id: 'audit-log',  label: 'Audit Log',    icon: HistoryIcon },
    ],
  },
  {
    label: 'Users',
    items: [
      { id: 'customers',  label: 'Customers',    icon: UsersIcon },
    ],
  },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(getStoredUser);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin  = (u) => setUser(u);
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };

  if (!user) return <AdminLogin onLogin={handleLogin} />;

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':       return <OverviewTab />;
      case 'products':       return <ProductsTab />;
      case 'orders':         return <OrdersTab />;
      case 'overdue':        return <OverdueTab />;
      case 'payment-rules':  return <PaymentRulesTab />;
      case 'cancellations':  return <CancellationsTab />;
      case 'audit-log':      return <AuditLogTab />;
      case 'customers':      return <AdminPanel />;
      default:               return <OverviewTab />;
    }
  };

  const NavItem = ({ item }) => (
    <button
      key={item.id}
      onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        activeTab === item.id
          ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
      }`}
    >
      <item.icon />
      {item.label}
    </button>
  );

  const Sidebar = () => (
    <aside className="w-64 bg-slate-900/70 border-r border-slate-800 shrink-0 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="text-white font-bold text-lg tracking-tight">Cruzaro <span className="text-slate-500 text-xs font-normal">Admin</span></span>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="space-y-1">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">{group.label}</p>
            {group.items.map(item => <NavItem key={item.id} item={item} />)}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
            {user.email[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate">{user.email}</p>
            <p className="text-indigo-400 text-[10px]">Administrator</p>
          </div>
        </div>
        <button
          id="admin-logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-sm font-medium"
        >
          <LogoutIcon />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-sans flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/60">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <span className="text-white font-bold">Cruzaro Admin</span>
        </div>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
