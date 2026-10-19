import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  User,
  MapPin,
  Clock,
  CreditCard,
  Package,
  Calendar,
  AlertCircle,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';
import MercuryButton from './mercury/MercuryButton';
import MercuryBadge from './mercury/MercuryBadge';

const fmt = (n) =>
  `GH₵ ${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function OrderDetailsModal({
  orderId,
  initialOrder = null,
  isOpen = true,
  onClose,
  onOrderUpdated,
  onStatusUpdated,
}) {
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

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (!isOpen && !orderId) return null;

  const handleStatusChange = async (newStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const { data } = await api.patch(`/admin/orders/${order.id}/status`, {
        status: newStatus,
      });
      setOrder((prev) => ({ ...prev, status: data.status }));
      setStatusVal(data.status);
      if (onOrderUpdated) onOrderUpdated();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const copyOrderCode = () => {
    navigator.clipboard.writeText(`#CRZ-${String(orderId).padStart(5, '0')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const total = Number(order?.total_price || 0) + Number(order?.penalty_amount || 0);
  const paid = Number(order?.amount_paid || 0);
  const balance = Math.max(0, total - paid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Flat backdrop */}
      <div
        className="fixed inset-0 bg-[#1B1D22]/20 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        style={{ boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)' }}
        className="relative bg-white border border-[#E1E4E8] rounded-[12px] w-full max-w-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (56px) */}
        <div className="px-6 py-4 border-b border-[#E1E4E8] flex items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[16px] font-semibold text-[#1B1D22]">
              #CRZ-{String(orderId).padStart(5, '0')}
            </span>
            <button
              onClick={copyOrderCode}
              className="text-[11px] px-2 py-0.5 bg-[#F4F5F7] hover:bg-[#ECEEF1] text-[#5F6877] rounded-[4px] border border-[#E1E4E8] transition flex items-center gap-1 font-mono"
            >
              {copied ? <Check className="w-3 h-3 text-[#1E7B50]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            {order?.payment_status && (
              <MercuryBadge variant={order.payment_status}>
                {order.payment_status.replace('_', ' ')}
              </MercuryBadge>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-[#8B93A1] hover:text-[#1B1D22] p-1 rounded-[6px] hover:bg-[#F4F5F7] transition"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-8 text-center text-[13px] text-[#5F6877]">
            <span className="w-4 h-4 border-2 border-[#5266EB] border-t-transparent rounded-full animate-spin inline-block mr-2" />
            Loading order details...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-[#C02B2B] space-y-3">
            <p className="text-[13px]">{error}</p>
            <MercuryButton size="sm" variant="secondary" onClick={onClose}>
              Dismiss
            </MercuryButton>
          </div>
        ) : (
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Customer & Delivery Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FAFAFB] border border-[#E1E4E8] rounded-[8px] space-y-2 text-[12px]">
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#1B1D22]">
                  <User className="w-3.5 h-3.5 text-[#5266EB]" strokeWidth={1.5} />
                  <span>Customer Details</span>
                </div>
                <div>Name: <strong className="text-[#1B1D22]">{order?.user?.name || 'Customer'}</strong></div>
                <div>Phone: <span className="font-mono text-[#1B1D22]">{order?.user?.phone || '—'}</span></div>
                <div>Email: <span className="text-[#5F6877]">{order?.user?.email || '—'}</span></div>
              </div>

              <div className="p-4 bg-[#FAFAFB] border border-[#E1E4E8] rounded-[8px] space-y-2 text-[12px]">
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#1B1D22]">
                  <MapPin className="w-3.5 h-3.5 text-[#5266EB]" strokeWidth={1.5} />
                  <span>Delivery Address</span>
                </div>
                <div>City: <strong className="text-[#1B1D22]">{order?.pickup_city || 'Accra Central'}</strong></div>
                <div>Region: <span className="text-[#1B1D22]">{order?.pickup_region || 'Greater Accra'}</span></div>
                <div>District: <span className="text-[#5F6877]">{order?.pickup_district || 'District 1'}</span></div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="text-[13px] font-medium text-[#1B1D22] mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#5266EB]" strokeWidth={1.5} />
                <span>Purchased Items</span>
              </div>
              <div className="border border-[#E1E4E8] rounded-[8px] overflow-hidden">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-[#F4F5F7] border-b border-[#E1E4E8] text-[#5F6877]">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E4E8]">
                    {(order?.items || order?.order_items || []).map((item, idx) => (
                      <tr key={item.id || idx} className="h-10 hover:bg-[#F4F5F7]">
                        <td className="px-3 font-medium text-[#1B1D22]">
                          {item.product?.name || item.name || 'Product Item'}
                        </td>
                        <td className="px-3 text-center tabular-nums font-mono text-[#5F6877]">
                          {item.quantity}
                        </td>
                        <td className="px-3 text-right tabular-nums font-mono text-[#5F6877]">
                          {fmt(item.price)}
                        </td>
                        <td className="px-3 text-right tabular-nums font-mono font-medium text-[#1B1D22]">
                          {fmt(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="p-4 bg-[#FAFAFB] border border-[#E1E4E8] rounded-[8px] space-y-2 text-[12px]">
              <div className="flex justify-between text-[#5F6877]">
                <span>Items Subtotal:</span>
                <span className="font-mono tabular-nums text-[#1B1D22]">{fmt(order?.total_price)}</span>
              </div>
              {Number(order?.penalty_amount || 0) > 0 && (
                <div className="flex justify-between text-[#C02B2B]">
                  <span>Late Payment Penalty (5%):</span>
                  <span className="font-mono tabular-nums">+{fmt(order?.penalty_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#1E7B50]">
                <span>Total Amount Paid:</span>
                <span className="font-mono tabular-nums">-{fmt(order?.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-[13px] font-semibold text-[#1B1D22] pt-2 border-t border-[#E1E4E8]">
                <span>Remaining Outstanding Balance:</span>
                <span className="font-mono tabular-nums text-[#5266EB]">{fmt(balance)}</span>
              </div>
            </div>

            {/* Fulfillment Status Selector */}
            <div className="flex items-center justify-between p-3 bg-white border border-[#E1E4E8] rounded-[8px]">
              <div className="text-[13px] font-medium text-[#1B1D22] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#5266EB]" strokeWidth={1.5} />
                <span>Update Fulfillment Status</span>
              </div>
              <select
                value={statusVal}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="h-8 px-2.5 bg-white border border-[#CDD1D8] rounded-[6px] text-[12px] text-[#1B1D22] focus:border-[#5266EB] focus:ring-1 focus:ring-[#5266EB]/20 focus:outline-none"
              >
                <option value="PENDING">Pending Processing</option>
                <option value="PROCESSING">Processing In Warehouse</option>
                <option value="SHIPPED">Dispatched / Shipped</option>
                <option value="DELIVERED">Delivered to Customer</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAFAFB] border-t border-[#E1E4E8] flex justify-end">
          <MercuryButton variant="secondary" size="sm" onClick={onClose}>
            Close
          </MercuryButton>
        </div>
      </div>
    </div>
  );
}
