import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

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

  // Perform filtering
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.items || []).some(item => (item.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesDate = true;
    if (filterDate) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      matchesDate = orderDate === filterDate;
    }

    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <h2 className="text-2xl font-bold text-white mb-6">Orders</h2>
        <div className="h-10 bg-slate-800 rounded-xl"></div>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Orders</h2>
        <p className="text-slate-400 text-sm mt-0.5">Manage customer orders, track payments, and update fulfillment statuses.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by Order ID, customer email, or item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/50 text-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-slate-900/60 border border-slate-700/50 text-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all cursor-pointer outline-none"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700/50"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Date Ordered</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Items Bought</th>
                <th className="px-6 py-4 font-semibold">Order Total</th>
                <th className="px-6 py-4 font-semibold">Paid</th>
                <th className="px-6 py-4 font-semibold">Balance</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                    No orders matching search or date filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const amountPaid = order.amount_paid ?? 0;
                  const outstanding = Math.max(0, order.total_price - amountPaid);
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold">#CRZ-{String(order.id).padStart(5, '0')}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">
                        {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
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
                      <td className="px-6 py-4 font-semibold text-slate-300">
                        GH₵ {Number(order.total_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#c7e74c]">
                        GH₵ {amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {outstanding > 0 ? (
                          <span className="text-amber-400">GH₵ {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-emerald-400">Paid in full</span>
                        )}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
