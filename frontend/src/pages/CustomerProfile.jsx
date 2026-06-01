import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CustomerProfile() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        setError(err.response?.data?.error || 'Failed to load order history');
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0b0f15] text-slate-100 pb-24">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#c7e74c]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Shop
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition"
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            Sign Out
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Customer Account</span>
              <h1 className="text-lg font-bold text-white truncate max-w-[200px] md:max-w-xs">{user.email}</h1>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
            Active
          </span>
        </div>

        {/* Order History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#c7e74c]">shopping_bag</span>
            Order History
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-slate-900/40 border border-slate-800 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-10 text-center space-y-4">
              <span className="material-symbols-outlined text-4xl text-slate-600">receipt_long</span>
              <div>
                <p className="text-slate-400 font-medium">No orders found</p>
                <p className="text-slate-600 text-xs mt-1">Products you buy will show up here.</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md transition"
              >
                Go Shop
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
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
      </div>
    </div>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({ order, onPaymentSuccess }) {
  const amountPaid = order.amount_paid ?? 0;
  const outstanding = Math.max(0, order.total_price - amountPaid);
  const isFullyPaid = outstanding <= 0;

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);

  const handleOpenPay = () => {
    setPayAmount(outstanding.toFixed(2));
    setPayError('');
    setPaySuccess(false);
    setPayOpen(true);
  };

  const handlePay = async () => {
    const num = parseFloat(payAmount);
    if (isNaN(num) || num <= 0) {
      setPayError('Enter a valid amount.');
      return;
    }
    if (num > outstanding) {
      setPayError(`Cannot exceed outstanding balance of GH₵ ${outstanding.toFixed(2)}.`);
      return;
    }

    setPaying(true);
    setPayError('');
    try {
      const { data } = await api.post(`/orders/${order.id}/pay`, { amount: num });
      setPaySuccess(true);
      onPaymentSuccess(data);
      // Close panel after short delay
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
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 space-y-4">
      {/* Order Header */}
      <div className="flex justify-between items-start border-b border-slate-800/60 pb-3">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Order ID</p>
          <p className="text-xs font-mono text-indigo-400 font-semibold">
            #CRZ-{order.id.toString().padStart(5, '0')}
          </p>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase
              ${order.status === 'PENDING'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : order.status === 'DELIVERED'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <img
              src={item.product.image_url}
              alt={item.product.name}
              className="w-12 h-12 object-cover rounded-xl bg-slate-800"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.product.unique_code}</p>
            </div>
            <div className="text-right text-xs">
              <p className="text-slate-300 font-semibold">
                GH₵ {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-slate-500">Qty: {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Summary */}
      <div className="pt-3 border-t border-slate-800/60 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Order Total</span>
          <span className="text-white font-bold">
            GH₵ {order.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Amount Paid</span>
          <span className="text-[#c7e74c] font-extrabold">
            GH₵ {amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {!isFullyPaid ? (
          <div className="flex justify-between items-center text-sm">
            <span className="text-amber-400/80">Outstanding Balance</span>
            <span className="text-amber-400 font-extrabold">
              GH₵ {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm text-emerald-400 font-semibold">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Paid in full
          </div>
        )}
      </div>

      {/* Pay Balance Button */}
      {!isFullyPaid && (
        <div>
          {!payOpen ? (
            <button
              onClick={handleOpenPay}
              className="w-full mt-1 flex items-center justify-center gap-2 py-3 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-400 hover:text-indigo-300 font-semibold rounded-2xl text-sm transition-all duration-200 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              Pay Balance
            </button>
          ) : (
            /* Inline Pay Panel */
            <div className="mt-1 bg-slate-800/60 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Pay Outstanding Balance</p>
                <button
                  onClick={() => { setPayOpen(false); setPayError(''); }}
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {paySuccess ? (
                <div className="flex items-center gap-2 py-2 text-emerald-400 font-semibold text-sm">
                  <span className="material-symbols-outlined">check_circle</span>
                  Payment recorded successfully!
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400">
                    Outstanding: <span className="text-amber-400 font-bold">GH₵ {outstanding.toFixed(2)}</span>
                    {' — '}you can pay any amount up to the full balance.
                  </p>

                  {payError && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                      {payError}
                    </p>
                  )}

                  {/* Amount input */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input
                      id={`pay-input-${order.id}`}
                      type="number"
                      min="0.01"
                      max={outstanding}
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => { setPayAmount(e.target.value); setPayError(''); }}
                      className="w-full pl-11 pr-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-sm font-semibold focus:outline-none transition"
                    />
                  </div>

                  {/* Quick-fill chips */}
                  <div className="flex gap-1.5">
                    {[25, 50, 75, 100].map((pct) => {
                      const val = (outstanding * pct) / 100;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => { setPayAmount(val.toFixed(2)); setPayError(''); }}
                          className="flex-1 py-1.5 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition"
                        >
                          {pct}%
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
                    className="w-full py-3 bg-[#c7e74c] hover:bg-[#b5d342] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {paying ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      `Pay GH₵ ${parseFloat(payAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
