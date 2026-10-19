import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Archive,
  CreditCard,
  BarChart3,
  Settings,
  AlertCircle,
  XCircle,
  FileText,
  Sliders,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import AdminLogin from './AdminLogin';
import OverviewTab from '../components/admin/OverviewTab';
import OrdersTab from '../components/admin/OrdersTab';
import ProductsTab from '../components/admin/ProductsTab';
import UsersTable from '../components/admin/UsersTable';
import InventoryTab from '../components/admin/InventoryTab';
import PaymentsAndPayoutsTab from '../components/admin/PaymentsAndPayoutsTab';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import OverdueTab from '../components/admin/OverdueTab';
import CancellationsTab from '../components/admin/CancellationsTab';
import AuditLogTab from '../components/admin/AuditLogTab';
import PaymentRulesTab from '../components/admin/PaymentRulesTab';
import MercuryCommandPalette from '../components/admin/mercury/MercuryCommandPalette';
import MercuryButton from '../components/admin/mercury/MercuryButton';
import { useUsers } from '../hooks/useUsers';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Hook for Customers page
  const { users, loading: usersLoading, error: usersError, togglingId, fetchUsers, toggleStatus } = useUsers();

  // Listen for Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <AdminLogin onLogin={handleLogin} />;

  const primaryNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Archive },
    { id: 'payments', label: 'Payments and Payouts', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const secondaryNavItems = [
    { id: 'overdue', label: 'Overdue Balances', icon: AlertCircle },
    { id: 'cancellations', label: 'Cancellations', icon: XCircle },
    { id: 'payment-rules', label: 'Payment Rules', icon: Sliders },
    { id: 'audit-log', label: 'Audit Log', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab onNavigateTab={setActiveTab} />;
      case 'orders':
        return <OrdersTab />;
      case 'products':
        return <ProductsTab />;
      case 'customers':
        return (
          <UsersTable
            users={users}
            loading={usersLoading}
            error={usersError}
            togglingId={togglingId}
            onToggle={toggleStatus}
            onRefresh={fetchUsers}
          />
        );
      case 'inventory':
        return <InventoryTab />;
      case 'payments':
        return <PaymentsAndPayoutsTab onNavigateTab={setActiveTab} />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <AdminSettingsTab />;
      case 'overdue':
        return <OverdueTab />;
      case 'cancellations':
        return <CancellationsTab />;
      case 'payment-rules':
        return <PaymentRulesTab />;
      case 'audit-log':
        return <AuditLogTab />;
      default:
        return <OverviewTab onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#1B1D22] flex font-sans antialiased selection:bg-[#5266EB] selection:text-white">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1B1D22]/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Left Sidebar (232px, --ash-50, 1px right border in --ash-200) ── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[232px] bg-[#F4F5F7] border-r border-[#E1E4E8] flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header (56px) */}
        <div className="h-14 px-5 border-b border-[#E1E4E8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-[#5266EB] text-white flex items-center justify-center font-bold text-xs select-none">
              C
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[14px] text-[#1B1D22] tracking-tight">Cruzaro</span>
              <span className="text-[10px] text-[#8B93A1] bg-[#ECEEF1] px-1.5 py-0.5 rounded-[4px] font-medium select-none">
                Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#8B93A1] hover:text-[#1B1D22] p-1"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation List (Items 36px high) */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto no-scrollbar">
          {/* Core Pages */}
          <div className="space-y-1">
            <p className="px-2.5 pb-1 text-[11px] font-medium text-[#8B93A1]">
              Workspace
            </p>
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[13px] font-medium transition-colors select-none text-left ${
                    isActive
                      ? 'bg-[#EEF0FD] text-[#5266EB]'
                      : 'text-[#5F6877] hover:bg-[#ECEEF1] hover:text-[#1B1D22]'
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-[#5266EB]' : 'text-[#8B93A1]'
                    }`}
                    strokeWidth={1.5}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-1 pt-2 border-t border-[#E1E4E8]">
            <p className="px-2.5 pb-1 text-[11px] font-medium text-[#8B93A1]">
              Financial Controls
            </p>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full h-9 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[13px] font-medium transition-colors select-none text-left ${
                    isActive
                      ? 'bg-[#EEF0FD] text-[#5266EB]'
                      : 'text-[#5F6877] hover:bg-[#ECEEF1] hover:text-[#1B1D22]'
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-[#5266EB]' : 'text-[#8B93A1]'
                    }`}
                    strokeWidth={1.5}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-[#E1E4E8]">
          <div className="flex items-center justify-between p-2 rounded-[8px] hover:bg-[#ECEEF1] transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-[6px] bg-[#E1E4E8] text-[#5F6877] flex items-center justify-center font-semibold text-xs shrink-0 select-none">
                {user.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-[#1B1D22] truncate">
                  {user.name || 'Admin'}
                </div>
                <div className="text-[11px] text-[#8B93A1] truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-[#8B93A1] hover:text-[#C02B2B] p-1 rounded-[6px] transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Viewport ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (56px, white, hairline bottom border) */}
        <header className="h-14 bg-white border-b border-[#E1E4E8] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
          {/* Left: Mobile trigger & Global search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#5F6877] hover:text-[#1B1D22] p-1.5 rounded-[6px] hover:bg-[#F4F5F7]"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* Quick search button triggering Command Palette */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 h-9 px-3 bg-[#F4F5F7] hover:bg-[#ECEEF1] border border-[#E1E4E8] rounded-[8px] text-[13px] text-[#5F6877] transition-colors w-48 sm:w-64"
            >
              <Search className="w-4 h-4 text-[#8B93A1]" strokeWidth={1.5} />
              <span className="truncate">Search commands...</span>
              <kbd className="hidden sm:inline-block ml-auto text-[10px] text-[#8B93A1] bg-white border border-[#E1E4E8] rounded-[4px] px-1 py-0.2 font-mono">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Actions, Notifications, Profile */}
          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative w-9 h-9 flex items-center justify-center text-[#5F6877] hover:text-[#1B1D22] hover:bg-[#F4F5F7] rounded-[8px] transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#5266EB] rounded-full" />
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div
                style={{ boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)' }}
                className="absolute top-11 right-12 w-80 bg-white border border-[#E1E4E8] rounded-[8px] p-3 z-40 space-y-2 animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-[#E1E4E8] pb-2">
                  <span className="text-[12px] font-semibold text-[#1B1D22]">Notifications</span>
                  <span className="text-[11px] text-[#5266EB] cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="p-2 bg-[#FAFAFB] rounded-[6px] border border-[#E1E4E8]">
                    <div className="font-medium text-[#1B1D22]">Paystack Balance Payment</div>
                    <div className="text-[#5F6877] text-[11px]">Order #14 settled GH₵ 1,250.00 via MTN MoMo</div>
                  </div>
                  <div className="p-2 bg-[#FAFAFB] rounded-[6px] border border-[#E1E4E8]">
                    <div className="font-medium text-[#1B1D22]">Inventory Threshold</div>
                    <div className="text-[#5F6877] text-[11px]">iPhone 18 stock level is now at 2 units</div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 h-9 px-2 hover:bg-[#F4F5F7] rounded-[8px] transition-colors"
              >
                <div className="w-6 h-6 rounded-[6px] bg-[#ECEEF1] text-[#1B1D22] flex items-center justify-center font-bold text-xs select-none">
                  {user.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="hidden md:inline-block text-[13px] font-medium text-[#1B1D22]">
                  {user.name || 'Admin'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8B93A1]" strokeWidth={1.5} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  style={{ boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)' }}
                  className="absolute top-11 right-0 w-48 bg-white border border-[#E1E4E8] rounded-[8px] py-1 z-40 divide-y divide-[#F4F5F7]"
                >
                  <div className="px-3 py-2">
                    <p className="text-[12px] font-medium text-[#1B1D22] truncate">{user.email}</p>
                    <p className="text-[11px] text-[#8B93A1]">Super Administrator</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-[12px] text-[#5F6877] hover:text-[#1B1D22] hover:bg-[#F4F5F7] flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#8B93A1]" strokeWidth={1.5} />
                      <span>Security &amp; Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('audit-log');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-[12px] text-[#5F6877] hover:text-[#1B1D22] hover:bg-[#F4F5F7] flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#8B93A1]" strokeWidth={1.5} />
                      <span>Audit Logs</span>
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-1.5 text-left text-[12px] text-[#C02B2B] hover:bg-[#FBEAEA] flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Content Canvas (--ash-25: #FAFAFB, max-w 1360px, 24-32px padding) ── */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1360px] w-full mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* Global Command Palette */}
      <MercuryCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(tabId) => setActiveTab(tabId)}
      />
    </div>
  );
}
