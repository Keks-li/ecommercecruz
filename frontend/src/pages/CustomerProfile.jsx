import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/shop/Navbar';
import CartDrawer from '../components/shop/CartDrawer';
import Footer from '../components/shop/Footer';

export default function CustomerProfile() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') {
      navigate('/auth?redirect=/profile');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders');
        setOrders(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    if (statusFilter === 'UNPAID') {
      return orders.filter((o) => ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(o.payment_status));
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-sm">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-blue-700 font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Verified Customer
                  </span>
                  <span className="text-xs text-slate-400">ID: #{user.id}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {user.email}
                </h1>
                <p className="text-xs text-slate-500">
                  Manage your active hire purchase plans, delivery tracking, and payment history.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center">
              <Link
                to="/"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
              >
                Store
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Order History Container */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">receipt_long</span>
                Order & Payment Records
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {orders.length} orders recorded on your account.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter('UNPAID')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'UNPAID'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Balances
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'PAID'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid in Full
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-white border border-slate-200 rounded-3xl animate-pulse shadow-sm" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <span className="material-symbols-outlined text-3xl">shopping_bag</span>
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-base">No Orders in this View</p>
                <p className="text-slate-500 text-xs">
                  {orders.length === 0
                    ? 'You have not placed any orders yet. Discover our latest flagship devices.'
                    : 'No orders match the selected filter.'}
                </p>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPaymentSuccess={(updatedOrder) =>
                    setOrders((prev) =>
                      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Footer />
    </div>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({ order, onPaymentSuccess }) {
  const amountPaid = order.amount_paid ?? 0;
  const outstanding = Math.max(0, order.total_price - amountPaid);
  const isFullyPaid = outstanding <= 0;
  const percentPaid = Math.min(100, Math.round((amountPaid / order.total_price) * 100)) || 0;

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);

  // Cancellation
  const cancelStatus = order.cancellation_status ?? order.cancellation?.status ?? 'NONE';
  const canCancel = ['PENDING', 'PARTIALLY_PAID'].includes(order.payment_status ?? '') &&
    !['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status) &&
    cancelStatus === 'NONE';
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const handleRequestCancel = async () => {
    if (!cancelReason.trim()) { setCancelError('Please provide a reason for cancellation.'); return; }
    setCancelling(true); 
    setCancelError('');
    try {
      await api.post(`/orders/${order.id}/cancel`, { reason: cancelReason });
      setCancelSuccess(true);
      setTimeout(() => { 
        setCancelOpen(false); 
        setCancelSuccess(false); 
        setCancelReason(''); 
      }, 2000);
      onPaymentSuccess({ ...order, cancellation_status: 'REQUESTED' });
    } catch (err) {
      setCancelError(err.response?.data?.error || 'Cancellation request failed.');
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenPay = () => {
    setPayAmount(outstanding.toFixed(2));
    setPayError('');
    setPaySuccess(false);
    setPayOpen(true);
  };

  const handlePay = async () => {
    const num = parseFloat(payAmount);
    if (isNaN(num) || num <= 0) {
      setPayError('Please enter a valid payment amount.');
      return;
    }
    if (num > outstanding) {
      setPayError(`Cannot exceed remaining balance of GH₵ ${outstanding.toFixed(2)}.`);
      return;
    }

    setPaying(true);
    setPayError('');
    try {
      const { data } = await api.post(`/orders/${order.id}/pay`, { amount: num });
      setPaySuccess(true);
      onPaymentSuccess(data);
      setTimeout(() => {
        setPayOpen(false);
        setPaySuccess(false);
        setPayAmount('');
      }, 1800);
    } catch (err) {
      setPayError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5 transition-all shadow-sm">
      
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Order Reference</span>
          <span className="font-mono text-xs font-bold text-blue-600">
            #CRZ-{order.id.toString().padStart(5, '0')}
          </span>
          <span className="text-slate-300 text-xs mx-2">•</span>
          <span className="text-slate-500 text-xs">
            {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Payment Status Pill */}
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
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

          {/* Fulfillment Status Pill */}
          <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 border border-slate-200 text-slate-700">
            {order.status}
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
              <img
                src={item.product?.image_url}
                alt={item.product?.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{item.product?.name}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.product?.unique_code}</p>
            </div>
            <div className="text-right text-xs shrink-0">
              <p className="text-slate-900 font-bold font-display">
                GH₵ {item.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-slate-500 text-[11px]">Qty: {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pickup Location Info */}
      {(order.pickup_region || order.pickup_city) && (
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-blue-600">pin_drop</span>
          <span className="font-semibold text-slate-900">Pickup Destination:</span>
          <span>
            {[order.pickup_city, order.pickup_district, order.pickup_region].filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      {/* Payment Progress Bar */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">Installment Progress ({percentPaid}%)</span>
          <span className="text-slate-900 font-bold font-display">
            GH₵ {amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / GH₵ {order.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFullyPaid ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${percentPaid}%` }}
          />
        </div>
      </div>

      {/* Balance Row & Action */}
      {!isFullyPaid ? (
        <div className="pt-2">
          {!payOpen ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 p-4 rounded-2xl">
              <div>
                <span className="text-[11px] text-blue-700 uppercase tracking-wider font-semibold block">Outstanding Balance</span>
                <span className="font-display text-lg font-bold text-slate-900">
                  GH₵ {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={handleOpenPay}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs tracking-wide shadow-sm transition-all active:scale-95 inline-flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span>Make Installment Payment</span>
              </button>
            </div>
          ) : (
            /* Inline Pay Modal / Box */
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Make Partial or Full Payment</h4>
                  <p className="text-slate-500 text-xs">
                    Remaining balance: <strong className="text-blue-600">GH₵ {outstanding.toFixed(2)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => { setPayOpen(false); setPayError(''); }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {paySuccess ? (
                <div className="flex items-center gap-2 py-3 text-emerald-700 font-bold text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Payment recorded successfully! Updating schedule...</span>
                </div>
              ) : (
                <>
                  {payError && (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                      {payError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700" htmlFor={`pay-input-${order.id}`}>
                      Payment Amount (GH₵)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">
                        GH₵
                      </span>
                      <input
                        id={`pay-input-${order.id}`}
                        type="number"
                        min="0.01"
                        max={outstanding}
                        step="0.01"
                        value={payAmount}
                        onChange={(e) => { setPayAmount(e.target.value); setPayError(''); }}
                        className="w-full pl-14 pr-4 py-2.5 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-bold focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Percentage Presets */}
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((pct) => {
                      const val = (outstanding * pct) / 100;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => { setPayAmount(val.toFixed(2)); setPayError(''); }}
                          className="flex-1 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 transition shadow-xs"
                        >
                          {pct}%
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
                    className="w-full py-3 bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                  >
                    {paying ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>Recording Payment...</span>
                      </>
                    ) : (
                      <span>
                        Confirm Payment of GH₵ {parseFloat(payAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl font-semibold">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Order fully paid. Thank you!</span>
        </div>
      )}

      {/* Cancellation Workflow */}
      <div className="pt-2">
        {cancelStatus !== 'NONE' ? (
          <div className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">info</span>
            <span>Cancellation Status: <strong className="text-slate-900 capitalize">{cancelStatus.toLowerCase()}</strong></span>
          </div>
        ) : canCancel ? (
          !cancelOpen ? (
            <button
              onClick={() => { setCancelOpen(true); setCancelError(''); }}
              className="text-xs text-slate-500 hover:text-rose-600 font-semibold transition inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">cancel</span>
              Request Order Cancellation
            </button>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700">Submit Cancellation Request</span>
                <button onClick={() => { setCancelOpen(false); setCancelError(''); }} className="text-slate-400 hover:text-slate-700">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {cancelSuccess ? (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl">
                  Cancellation request submitted. An admin will review it shortly.
                </div>
              ) : (
                <>
                  {cancelError && <p className="text-xs text-rose-700">{cancelError}</p>}
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => { setCancelReason(e.target.value); setCancelError(''); }}
                    placeholder="State reason for cancelling this order..."
                    className="w-full px-3 py-2 bg-white border border-rose-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:border-rose-500 resize-none"
                  />
                  <button
                    onClick={handleRequestCancel}
                    disabled={cancelling || !cancelReason.trim()}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-40 shadow-sm"
                  >
                    {cancelling ? 'Submitting...' : 'Confirm Request'}
                  </button>
                </>
              )}
            </div>
          )
        ) : null}
      </div>

    </div>
  );
}
