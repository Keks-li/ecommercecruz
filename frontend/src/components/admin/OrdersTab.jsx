import { useState, useEffect } from 'react';
import api from '../../services/api';
import OrderDetailsModal from './OrderDetailsModal';

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED'
  const [selectedOrderId, setSelectedOrderId] = useState(null);

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

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount_paid || 0), 0);
  const totalOutstanding = orders.reduce((sum, o) => {
    const bal = Math.max(0, (o.total_price || 0) + (o.penalty_amount || 0) - (o.amount_paid || 0));
    return sum + bal;
  }, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'PENDING').length;
  const shippedOrdersCount = orders.filter(o => o.status === 'SHIPPED').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'DELIVERED').length;

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

    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      matchesStatus = order.status === statusFilter;
    }

    return matchesSearch && matchesDate && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <h2 className="text-2xl font-bold text-white mb-6">Orders</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-800 rounded-2xl" />)}
        </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Orders Management</h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage customer orders, track payments, inspect pickup addresses, and update fulfillment.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Orders
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-white mt-1">{orders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            📦
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected Revenue</p>
            <p className="text-2xl font-bold text-[#c7e74c] mt-1">GH₵ {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#c7e74c]/10 border border-[#c7e74c]/20 flex items-center justify-center text-[#c7e74c]">
            💰
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unpaid Balance</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">GH₵ {totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            ⏳
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Shipment</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{pendingOrdersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            🚚
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status quick tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'All', count: orders.length },
            { id: 'PENDING', label: 'Pending', count: pendingOrdersCount },
            { id: 'SHIPPED', label: 'Shipped', count: shippedOrdersCount },
            { id: 'DELIVERED', label: 'Delivered', count: deliveredOrdersCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.id ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Date Input */}
        <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-lg">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search ID, email, or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/50 text-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-slate-900/60 border border-slate-700/50 text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all cursor-pointer outline-none"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700/50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Order ID</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Customer</th>
                <th className="px-5 py-3.5 font-semibold">Items</th>
                <th className="px-5 py-3.5 font-semibold">Total</th>
                <th className="px-5 py-3.5 font-semibold">Paid</th>
                <th className="px-5 py-3.5 font-semibold">Balance</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <span className="text-4xl block mb-2">🔍</span>
                    No orders matching search, date, or status filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const amountPaid = order.amount_paid ?? 0;
                  const penalty = order.penalty_amount ?? 0;
                  const outstanding = Math.max(0, order.total_price + penalty - amountPaid);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-white group-hover:text-indigo-400 transition-colors whitespace-nowrap">
                        #CRZ-{String(order.id).padStart(5, '0')}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 max-w-[160px] truncate">
                        <span className="text-xs font-medium text-slate-200 block truncate" title={order.user?.email}>
                          {order.user?.email || 'Unknown'}
                        </span>
                        {order.pickup_city && (
                          <span className="text-[10px] text-slate-500 block truncate">📍 {order.pickup_city}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 max-w-[220px]">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-0.5 text-xs truncate">
                            {order.items.slice(0, 2).map((item) => (
                              <div key={item.id} className="truncate text-slate-300">
                                <span className="text-slate-200">{item.product?.name || 'Product'}</span>
                                <span className="text-slate-500 ml-1.5 font-semibold">×{item.quantity}</span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <span className="text-[10px] text-indigo-400 font-semibold">+{order.items.length - 2} more item(s)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-xs">No items</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-200 whitespace-nowrap text-xs">
                        GH₵ {Number(order.total_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#c7e74c] whitespace-nowrap text-xs">
                        GH₵ {amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 font-semibold whitespace-nowrap text-xs">
                        {outstanding > 0 ? (
                          <span className="text-amber-400">GH₵ {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-emerald-400">Paid in full</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`bg-slate-800 border text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors
                            ${order.status === 'PENDING' ? 'border-amber-500/50 text-amber-400' :
                              order.status === 'SHIPPED' ? 'border-blue-500/50 text-blue-400' :
                                'border-emerald-500/50 text-emerald-400'}`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition"
                        >
                          View Details 👁️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          initialOrder={orders.find(o => o.id === selectedOrderId)}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={(orderId, newStatus) => {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
          }}
        />
      )}
    </div>
  );
}
