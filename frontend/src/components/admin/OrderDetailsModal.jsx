import { useState, useEffect } from 'react';
import api from '../../services/api';

const fmt = (n) => `GH₵ ${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const STATUS_COLORS = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  PARTIALLY_PAID: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  OVERDUE: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  SHIPPED: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  REQUESTED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  APPROVED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  REFUNDED: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
};

export default function OrderDetailsModal({ orderId, initialOrder = null, onClose, onStatusUpdated }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [updating, setUpdating] = useState(false);
  const [statusVal, setStatusVal] = useState(initialOrder?.status || 'PENDING');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchOrder() {
      if (!orderId) return;
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/admin/orders/${orderId}`);
        if (isMounted) {
          setOrder(data);
          setStatusVal(data.status || 'PENDING');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to fetch order details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // Always fetch fresh single order to get complete relations (transactions, full items, addresses)
    fetchOrder();

    return () => { isMounted = false; };
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const { data } = await api.patch(`/admin/orders/${order.id}/status`, { status: newStatus });
      setOrder(prev => ({ ...prev, status: data.status }));
      setStatusVal(data.status);
      if (onStatusUpdated) onStatusUpdated(order.id, data.status);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const copyOrderCode = () => {
    if (!order) return;
    const code = `#CRZ-${String(order.id).padStart(5, '0')}`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!orderId) return null;

  const total = order?.total_price ?? 0;
  const paid = order?.amount_paid ?? 0;
  const penalty = order?.penalty_amount ?? 0;
  const balance = Math.max(0, total + penalty - paid);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0f1524] border border-slate-700/80 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/60">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xl font-extrabold text-white">
              #CRZ-{String(orderId).padStart(5, '0')}
            </span>
            <button
              onClick={copyOrderCode}
              title="Copy Order Code"
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition flex items-center gap-1"
            >
              {copied ? '✓ Copied' : 'Copy ID'}
            </button>
            {order?.payment_status && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_COLORS[order.payment_status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {order.payment_status.replace('_', ' ')}
              </span>
            )}
            {order?.status && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_COLORS[order.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                Fulfillment: {order.status}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-800 rounded-lg w-1/3" />
            <div className="h-20 bg-slate-800 rounded-xl" />
            <div className="h-40 bg-slate-800 rounded-xl" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 space-y-3">
            <p className="font-semibold">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Top Grid: Customer & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  Customer Account
                </p>
                <p className="text-slate-200 font-semibold text-sm truncate">{order.user?.email || 'Unknown User'}</p>
                <p className="text-slate-500 text-xs mt-1">User ID: #{order.user_id}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Order Date: {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>

              {/* Delivery / Pickup Box */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Pickup & Delivery Location
                </p>
                <div className="text-xs space-y-1">
                  <p className="text-slate-200 font-semibold">
                    {order.pickup_region ? `${order.pickup_region} Region` : 'Region: Not specified'}
                  </p>
                  <p className="text-slate-400">
                    District: <span className="text-slate-200">{order.pickup_district || '—'}</span>
                  </p>
                  <p className="text-slate-400">
                    City / Town: <span className="text-slate-200">{order.pickup_city || '—'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Line Items List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Purchased Products ({order.items?.length || 0})
              </h4>
              <div className="divide-y divide-slate-800/80">
                {(!order.items || order.items.length === 0) ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No items listed for this order.</p>
                ) : (
                  order.items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product?.name || 'Product'}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-700/60 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                            📦
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">
                            {item.product?.name || 'Product'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            {item.product?.unique_code && (
                              <span className="font-mono text-slate-500">{item.product.unique_code}</span>
                            )}
                            <span>Qty: {item.quantity}</span>
                            <span>•</span>
                            <span>{fmt(item.price)} each</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">
                          {fmt(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Financial Summary & Status Control Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Financial Breakdown */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Financial Settlement
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Order Subtotal:</span>
                    <span className="font-semibold text-slate-200">{fmt(total)}</span>
                  </div>
                  {penalty > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Overdue Penalty ({order.penalty_pct || 10}%):</span>
                      <span className="font-semibold">+{fmt(penalty)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#c7e74c]">
                    <span>Amount Paid to Date:</span>
                    <span className="font-bold">{fmt(paid)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-300">Outstanding Balance:</span>
                    <span className={`font-extrabold ${balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {balance > 0 ? fmt(balance) : 'Fully Settled ✓'}
                    </span>
                  </div>
                  {order.payment_due_date && (
                    <div className="pt-2 text-[11px] text-slate-400">
                      Payment Due: <span className="text-slate-200 font-semibold">{new Date(order.payment_due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fulfillment Actions */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Fulfillment Status
                  </h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Update the fulfillment status as this order gets processed and dispatched.
                  </p>
                  <select
                    value={statusVal}
                    disabled={updating}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="PENDING">Pending (Preparing)</option>
                    <option value="SHIPPED">Shipped (In Transit)</option>
                    <option value="DELIVERED">Delivered (Completed)</option>
                  </select>
                </div>

                {updating && <p className="text-[11px] text-indigo-400 animate-pulse mt-2">Updating status…</p>}

                {order.cancellation_status && order.cancellation_status !== 'NONE' && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                    <span className="font-bold">Cancellation Status: </span>
                    {order.cancellation_status}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Transactions Timeline */}
            {order.transactions && order.transactions.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recorded Payment Transactions ({order.transactions.length})
                </h4>
                <div className="space-y-2">
                  {order.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              tx.payment_method === 'PAYSTACK'
                                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {tx.payment_method}
                          </span>
                          {tx.reference && <span className="font-mono text-slate-500 text-[10px]">ref: {tx.reference}</span>}
                        </div>
                        {tx.note && <p className="text-slate-400 text-[11px] mt-0.5">{tx.note}</p>}
                        <p className="text-slate-600 text-[10px] mt-0.5">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`font-bold text-sm ${tx.amount < 0 ? 'text-rose-400' : 'text-[#c7e74c]'}`}>
                        {fmt(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
