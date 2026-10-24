import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { payWithPaystack } from '../services/paystack';
import { useCart } from '../context/CartContext';
import Navbar from '../components/shop/Navbar';
import CartDrawer from '../components/shop/CartDrawer';
import Footer from '../components/shop/Footer';

export default function CustomerProfile() {
  const { cartOpen, setCartOpen, closeCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paystackBanner, setPaystackBanner] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'
  const navigate = useNavigate();

  // User & Profile State
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');

  // Payment Modal State
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);

  // Accordion open/close state: track expanded order IDs
  // By default, the latest order (if any) is expanded
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') {
      navigate('/auth?redirect=/profile');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders');
        setOrders(data);
        // Automatically expand the newest order
        if (data && data.length > 0) {
          setExpandedOrders({ [data[0].id]: true });
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Check if customer returned from Paystack checkout redirect
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref');
    if (ref) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const verifyReturnPayment = async () => {
        try {
          const { data } = await api.get(`/paystack/verify/${encodeURIComponent(ref)}`);
          setPaystackBanner({
            type: 'SUCCESS',
            message: `Paystack payment verified successfully (Ref: ${ref})! Your order balance has been credited.`,
          });
          const { data: refreshed } = await api.get('/orders');
          setOrders(refreshed);
        } catch (vErr) {
          setPaystackBanner({
            type: 'ERROR',
            message: vErr.response?.data?.error || 'Payment verification encountered an issue. Please contact support.',
          });
        }
      };
      verifyReturnPayment();
    }
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setError('');
    try {
      const { data } = await api.patch('/auth/profile', {
        phone: profilePhone.trim() || null,
        name: profileName.trim() || null,
      });
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setProfileModalOpen(false);
      setProfileNotice('Profile updated successfully!');
      setTimeout(() => setProfileNotice(''), 3500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // High-level summary metrics
  const stats = useMemo(() => {
    const total = orders.length;
    const unpaidCount = orders.filter((o) =>
      ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(o.payment_status)
    ).length;
    const totalOutstanding = orders.reduce((sum, o) => {
      const paid = o.amount_paid ?? 0;
      const diff = Math.max(0, o.total_price - paid);
      return sum + diff;
    }, 0);
    const activeDeliveries = orders.filter((o) =>
      ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status)
    ).length;
    return { total, unpaidCount, totalOutstanding, activeDeliveries };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    if (statusFilter === 'UNPAID') {
      return orders.filter((o) =>
        ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(o.payment_status)
      );
    }
    if (statusFilter === 'PAID') {
      return orders.filter((o) => o.payment_status === 'PAID');
    }
    return orders;
  }, [orders, statusFilter]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      <Navbar onCartClick={() => setCartOpen(true)} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Notice Banner */}
        {profileNotice && (
          <div className="p-3.5 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{profileNotice}</span>
          </div>
        )}

        {/* Paystack notification banner */}
        {paystackBanner && (
          <div
            className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in ${
              paystackBanner.type === 'SUCCESS'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">
                {paystackBanner.type === 'SUCCESS' ? 'check_circle' : 'error'}
              </span>
              <span>{paystackBanner.message}</span>
            </div>
            <button
              onClick={() => setPaystackBanner(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* ── Compact Executive Customer Header ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* User Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                    {user.name || user.email}
                  </h1>
                  <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                    Verified
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                  <span className="truncate">{user.email}</span>
                  {user.phone ? (
                    <button
                      onClick={() => {
                        setProfilePhone(user.phone || '');
                        setProfileName(user.name || '');
                        setProfileModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600 font-medium transition"
                      title="Edit phone number"
                    >
                      <span className="material-symbols-outlined text-[13px] text-blue-600">smartphone</span>
                      <span className="font-mono">{user.phone}</span>
                      <span className="material-symbols-outlined text-[12px] text-slate-400">edit</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setProfilePhone('');
                        setProfileName(user.name || '');
                        setProfileModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                    >
                      <span className="material-symbols-outlined text-[13px]">add</span>
                      Add Ghana Mobile
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <Link
                to="/"
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">storefront</span>
                Shop
              </Link>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">logout</span>
                Sign Out
              </button>
            </div>
          </div>

          {/* Mini KPI Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100 text-center sm:text-left">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 sm:px-4 sm:py-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                Total Orders
              </span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 font-display">
                {stats.total}
              </span>
            </div>

            <div className={`rounded-xl p-2.5 sm:px-4 sm:py-3 border ${
              stats.totalOutstanding > 0
                ? 'bg-blue-50/60 border-blue-200'
                : 'bg-emerald-50/60 border-emerald-200'
            }`}>
              <span className={`text-[10px] uppercase tracking-wider font-bold block ${
                stats.totalOutstanding > 0 ? 'text-blue-700' : 'text-emerald-700'
              }`}>
                {stats.totalOutstanding > 0 ? 'Outstanding Balance' : 'Balance Settled'}
              </span>
              <span className={`text-base sm:text-lg font-extrabold font-display ${
                stats.totalOutstanding > 0 ? 'text-slate-900' : 'text-emerald-700'
              }`}>
                GH₵ {stats.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 sm:px-4 sm:py-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                Active In-Transit
              </span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 font-display">
                {stats.activeDeliveries}
              </span>
            </div>
          </div>
        </div>

        {/* ── Orders Section ── */}
        <div className="space-y-4">
          
          {/* Section Bar with Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-blue-600">receipt_long</span>
                Your Orders & Installments
              </h2>
              <p className="text-xs text-slate-500">
                Click any order to view item breakdown, delivery destination, or payment history.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter('UNPAID')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === 'UNPAID'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({stats.unpaidCount})
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === 'PAID'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid ({orders.length - stats.unpaidCount})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse shadow-xs" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              </div>
              <p className="text-slate-900 font-bold text-sm">No Orders Found</p>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                {orders.length === 0
                  ? 'You have not placed any orders yet. Discover our premium devices and flexible installment plans.'
                  : 'No orders match the selected filter category.'}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <span className="material-symbols-outlined text-[15px]">grid_view</span>
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order, idx) => (
                <CompactOrderCard
                  key={order.id}
                  order={order}
                  isNewest={idx === 0}
                  isExpanded={Boolean(expandedOrders[order.id])}
                  onToggleExpand={() => toggleExpand(order.id)}
                  onOpenPayModal={(ord) => setPaymentModalOrder(ord)}
                  onOrderUpdated={(updated) =>
                    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
                  }
                />
              ))}
            </div>
          )}
        </div>

      </main>

      {/* ── Standalone Installment Payment Modal ── */}
      {paymentModalOrder && (
        <PaymentModal
          order={paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          onSuccess={(updatedOrder) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
            setPaystackBanner({
              type: 'SUCCESS',
              message: `Payment recorded successfully for Order #CRZ-${updatedOrder.id.toString().padStart(5, '0')}!`,
            });
            setPaymentModalOrder(null);
          }}
        />
      )}

      {/* ── Customer Profile Edit Modal ── */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Customer Profile Details</h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghana Mobile Number
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="e.g. 0244123456 or +233244123456"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Used for Paystack mobile money prompts & courier delivery dispatch.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={closeCart} />
      <Footer />
    </div>
  );
}

// ─── Compact Accordion Order Card ──────────────────────────────────────────────
function CompactOrderCard({
  order,
  isNewest,
  isExpanded,
  onToggleExpand,
  onOpenPayModal,
  onOrderUpdated,
}) {
  const amountPaid = order.amount_paid ?? 0;
  const outstanding = Math.max(0, order.total_price - amountPaid);
  const isFullyPaid = outstanding <= 0;
  const percentPaid = Math.min(100, Math.round((amountPaid / order.total_price) * 100)) || 0;

  // Cancellation state
  const cancelStatus = order.cancellation_status ?? order.cancellation?.status ?? 'NONE';
  const canCancel =
    ['PENDING', 'PARTIALLY_PAID'].includes(order.payment_status ?? '') &&
    !['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status) &&
    cancelStatus === 'NONE';

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleRequestCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Please state reason for cancellation.');
      return;
    }
    setCancelling(true);
    setCancelError('');
    try {
      await api.post(`/orders/${order.id}/cancel`, { reason: cancelReason });
      onOrderUpdated({ ...order, cancellation_status: 'REQUESTED' });
      setCancelOpen(false);
      setCancelReason('');
    } catch (err) {
      setCancelError(err.response?.data?.error || 'Cancellation request failed.');
    } finally {
      setCancelling(false);
    }
  };

  // Preview product images (up to 3)
  const itemThumbnails = (order.items || []).slice(0, 3);
  const totalItemCount = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
  const firstItemName = order.items?.[0]?.product?.name || 'Cruzaro Item';

  return (
    <div className={`bg-white border rounded-2xl transition-all duration-150 overflow-hidden shadow-xs ${
      isNewest ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
    }`}>
      
      {/* ── Compact Summary Bar (Always Visible) ── */}
      <div
        onClick={onToggleExpand}
        className="p-3.5 sm:p-4 cursor-pointer select-none flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
      >
        {/* Left: Ref, Date & Product Thumbnails */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Thumbnails Stack */}
          <div className="flex -space-x-2 shrink-0">
            {itemThumbnails.map((item, i) => (
              <div
                key={item.id || i}
                className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 overflow-hidden shadow-2xs shrink-0 flex items-center justify-center"
              >
                <img
                  src={item.product?.image_url}
                  alt={item.product?.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>

          {/* Reference & Titles */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900">
                #CRZ-{order.id.toString().padStart(5, '0')}
              </span>
              {isNewest && (
                <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold uppercase px-1.5 py-0.2 rounded tracking-wider">
                  Latest
                </span>
              )}
              <span className="text-slate-300 text-xs hidden sm:inline">•</span>
              <span className="text-slate-400 text-xs hidden sm:inline">
                {new Date(order.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <p className="text-xs text-slate-600 truncate mt-0.5">
              <span className="font-semibold text-slate-800">{firstItemName}</span>
              {order.items?.length > 1 && (
                <span className="text-slate-500 font-normal"> + {totalItemCount - 1} more items</span>
              )}
            </p>
          </div>
        </div>

        {/* Center / Right: Status Pills & Financials */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          
          {/* Status Badges */}
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                order.payment_status === 'PAID'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : order.payment_status === 'PARTIALLY_PAID'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : order.payment_status === 'OVERDUE'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {order.payment_status?.replace('_', ' ')}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 hidden sm:inline">
              {order.status}
            </span>
          </div>

          {/* Balance / Price Display */}
          <div className="text-right">
            <p className="text-xs font-extrabold text-slate-900 font-display">
              GH₵ {order.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {outstanding > 0 ? (
              <p className="text-[11px] font-bold text-blue-600">
                Bal: GH₵ {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            ) : (
              <p className="text-[10px] font-bold text-emerald-600">Paid in full</p>
            )}
          </div>

          {/* Action Button & Expand Toggle */}
          <div className="flex items-center gap-1.5 pl-1" onClick={(e) => e.stopPropagation()}>
            {!isFullyPaid && (
              <button
                type="button"
                onClick={() => onOpenPayModal(order)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">payments</span>
                <span>Pay</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleExpand}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title={isExpanded ? 'Collapse' : 'Expand Details'}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}>
                expand_more
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* ── Expanded Detail View (Collapsible) ── */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Left Column (Items & Pickup) */}
            <div className="md:col-span-7 space-y-3">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                Order Items ({order.items?.length || 0})
              </h4>

              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={item.product?.image_url}
                        alt={item.product?.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{item.product?.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.product?.unique_code}</p>
                    </div>
                    <div className="text-right text-xs shrink-0">
                      <p className="text-slate-900 font-bold font-display">
                        GH₵ {(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-slate-500 text-[10px]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pickup & Delivery Location */}
              {(order.pickup_region || order.pickup_city) && (
                <div className="flex items-start gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="material-symbols-outlined text-[16px] text-blue-600 shrink-0 mt-0.5">
                    pin_drop
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">Pickup Destination: </span>
                    <span>
                      {[order.pickup_city, order.pickup_district, order.pickup_region]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Settlement, Progress & Receipts) */}
            <div className="md:col-span-5 space-y-3">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                Payment & Installment Breakdown
              </h4>

              {/* Payment Summary Box */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total Price</span>
                  <span className="font-bold text-slate-900 font-display">
                    GH₵ {order.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Amount Paid</span>
                  <span className="font-bold text-emerald-600 font-display">
                    GH₵ {amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {outstanding > 0 ? (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-800">Balance Remaining</span>
                    <span className="font-bold text-blue-600 font-display text-sm">
                      GH₵ {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>Fully Paid</span>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Payment Progress</span>
                    <span className="font-bold">{percentPaid}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFullyPaid ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                </div>

                {/* Pay Button */}
                {!isFullyPaid && (
                  <button
                    onClick={() => onOpenPayModal(order)}
                    className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px]">credit_card</span>
                    <span>Make Installment Payment</span>
                  </button>
                )}
              </div>

              {/* Transactions / Receipts Dropdown */}
              {order.transactions && order.transactions.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(!historyOpen)}
                    className="w-full p-2.5 flex items-center justify-between font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <span className="flex items-center gap-1 text-[11px]">
                      <span className="material-symbols-outlined text-[14px] text-blue-600">receipt</span>
                      Payment Receipts ({order.transactions.length})
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                      {historyOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {historyOpen && (
                    <div className="p-2.5 pt-0 space-y-1.5 border-t border-slate-100">
                      {order.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-[11px]"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{tx.payment_method}</span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {tx.reference || `#${tx.id}`}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(tx.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 font-display">
                            GH₵ {tx.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cancellation Option */}
              <div>
                {cancelStatus !== 'NONE' ? (
                  <div className="text-[11px] font-semibold text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                    Cancellation: <strong className="capitalize">{cancelStatus.toLowerCase()}</strong>
                  </div>
                ) : canCancel ? (
                  !cancelOpen ? (
                    <button
                      onClick={() => setCancelOpen(true)}
                      className="text-[11px] text-slate-400 hover:text-rose-600 font-medium transition inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">cancel</span>
                      Need to cancel this order?
                    </button>
                  ) : (
                    <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-800 text-[11px]">Request Order Cancellation</span>
                        <button onClick={() => setCancelOpen(false)} className="text-slate-400 hover:text-slate-700">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                      {cancelError && <p className="text-[10px] text-rose-700">{cancelError}</p>}
                      <textarea
                        rows={2}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancelling..."
                        className="w-full p-2 bg-white border border-rose-200 text-slate-900 rounded-lg text-xs focus:outline-none focus:border-rose-500 resize-none"
                      />
                      <button
                        onClick={handleRequestCancel}
                        disabled={cancelling || !cancelReason.trim()}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition disabled:opacity-40"
                      >
                        {cancelling ? 'Submitting...' : 'Confirm Cancellation'}
                      </button>
                    </div>
                  )
                ) : null}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// ─── Standalone Installment Payment Modal ──────────────────────────────────────
function PaymentModal({ order, onClose, onSuccess }) {
  const amountPaid = order.amount_paid ?? 0;
  const outstanding = Math.max(0, order.total_price - amountPaid);

  const [payAmount, setPayAmount] = useState(outstanding.toFixed(2));
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  const handlePay = async () => {
    const num = parseFloat(payAmount);
    if (isNaN(num) || num <= 0) {
      setPayError('Please enter a valid payment amount.');
      return;
    }
    if (num > outstanding) {
      setPayError(`Amount cannot exceed the remaining balance of GH₵ ${outstanding.toFixed(2)}.`);
      return;
    }

    setPaying(true);
    setPayError('');
    try {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');

      // 1. Initialize Paystack balance payment session
      const { data } = await api.post(`/orders/${order.id}/paystack/initialize`, {
        amount: num,
        email: userObj.email,
        phone: userObj.phone,
      });

      // 2. Launch Paystack inline checkout or hosted redirect
      await payWithPaystack({
        email: userObj.email,
        phone: userObj.phone,
        amountInCedis: num,
        reference: data.reference,
        accessCode: data.access_code,
        authorizationUrl: data.authorization_url,
        onSuccess: async (paystackRes) => {
          try {
            const { data: verified } = await api.get(`/paystack/verify/${encodeURIComponent(paystackRes.reference)}`);
            onSuccess(verified.order || order);
          } catch (vErr) {
            setPayError(vErr.response?.data?.error || 'Verification pending. Please refresh your orders.');
          } finally {
            setPaying(false);
          }
        },
        onClose: () => {
          setPaying(false);
          setPayError('Payment session cancelled by user.');
        },
        onError: (pErr) => {
          setPaying(false);
          setPayError(pErr.message || 'Payment initiation failed.');
        },
      });
    } catch (err) {
      setPaying(false);
      setPayError(err.response?.data?.error || err.message || 'Failed to initialize Paystack payment.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Make Installment Payment</h3>
            <p className="text-slate-400 font-mono text-[10px]">
              Order #CRZ-{order.id.toString().padStart(5, '0')}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Balance Info */}
        <div className="bg-blue-50/70 border border-blue-200/80 p-3 rounded-xl flex items-center justify-between">
          <span className="text-xs text-blue-900 font-medium">Remaining Balance:</span>
          <span className="text-sm font-extrabold text-blue-900 font-display">
            GH₵ {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {payError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {payError}
          </div>
        )}

        {/* Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Amount to Pay (GH₵)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">
              GH₵
            </span>
            <input
              type="number"
              min="0.01"
              max={outstanding}
              step="0.01"
              value={payAmount}
              onChange={(e) => {
                setPayAmount(e.target.value);
                setPayError('');
              }}
              className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-slate-900 text-sm font-bold focus:outline-none transition"
            />
          </div>
        </div>

        {/* Quick Percent Presets */}
        <div className="flex gap-1.5">
          {[25, 50, 75, 100].map((pct) => {
            const val = (outstanding * pct) / 100;
            return (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  setPayAmount(val.toFixed(2));
                  setPayError('');
                }}
                className="flex-1 py-1 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition"
              >
                {pct === 100 ? 'Full' : `${pct}%`}
              </button>
            );
          })}
        </div>

        {/* Payment CTA */}
        <button
          onClick={handlePay}
          disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
          className="w-full py-2.5 bg-[#0ba4db] hover:bg-[#0991c2] disabled:opacity-40 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
        >
          {paying ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span>Connecting Paystack...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[15px]">lock</span>
              <span>
                Pay GH₵ {parseFloat(payAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </>
          )}
        </button>

        {/* Accepted Payment Channels */}
        <div className="text-center text-[10px] text-slate-400 pt-1">
          <span>MTN MoMo • Telecel Cash • AirtelTigo • Debit Card</span>
        </div>

      </div>
    </div>
  );
}
