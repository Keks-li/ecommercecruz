import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data: updatedOrder } = await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updatedOrder.status } : o))
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <h2 className="text-2xl font-bold text-white mb-6">Orders</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-800 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/30">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Orders</h2>
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Items Bought</th>
                <th className="px-6 py-4 font-semibold">Amount Paid</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono">#{order.id}</td>
                    <td className="px-6 py-4">{order.user?.email || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      {order.items && order.items.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          {order.items.map((item) => (
                            <li key={item.id}>
                              <span className="text-slate-200">{item.product?.name || 'Unknown Product'}</span>
                              <span className="text-slate-500 ml-2">x{item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-500 italic">No items</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-indigo-400">
                      ₦{Number(order.total_price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`bg-slate-800 border text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors
                          ${order.status === 'PENDING' ? 'border-amber-500/50 text-amber-400' :
                            order.status === 'SHIPPED' ? 'border-blue-500/50 text-blue-400' :
                              'border-emerald-500/50 text-emerald-400'}`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
