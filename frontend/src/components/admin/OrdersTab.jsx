import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import OrderDetailsModal from './OrderDetailsModal';
import MercuryCard from './mercury/MercuryCard';
import MercuryKpiCard from './mercury/MercuryKpiCard';
import MercuryTable from './mercury/MercuryTable';
import MercuryButton from './mercury/MercuryButton';
import MercuryInput from './mercury/MercuryInput';
import MercuryBadge from './mercury/MercuryBadge';

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount_paid || 0), 0);
  const totalOutstanding = orders.reduce((sum, o) => {
    const bal = Math.max(0, (o.total_price || 0) + (o.penalty_amount || 0) - (o.amount_paid || 0));
    return sum + bal;
  }, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING' || o.payment_status === 'PENDING').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const filteredOrders = orders.filter((order) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      String(order.id).toLowerCase().includes(q) ||
      (order.user?.email || '').toLowerCase().includes(q) ||
      (order.user?.name || '').toLowerCase().includes(q) ||
      (order.user?.phone || '').toLowerCase().includes(q) ||
      (order.items || []).some((item) =>
        (item.product?.name || '').toLowerCase().includes(q)
      );

    let matchesDate = true;
    if (filterDate) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      matchesDate = orderDate === filterDate;
    }

    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      matchesStatus =
        order.status === statusFilter || order.payment_status === statusFilter;
    }

    return matchesSearch && matchesDate && matchesStatus;
  });

  const columns = [
    {
      header: 'Order',
      key: 'id',
      render: (row) => (
        <span className="font-mono text-[12px] font-medium text-[#1B1D22]">
          #{row.id}
        </span>
      ),
    },
    {
      header: 'Customer',
      key: 'customer',
      render: (row) => (
        <div>
          <div className="font-medium text-[#1B1D22]">
            {row.user?.name || row.customer_name || 'Customer'}
          </div>
          <div className="text-[11px] text-[#8B93A1] font-mono">
            {row.user?.phone || row.user?.email || '—'}
          </div>
        </div>
      ),
    },
    {
      header: 'Items',
      key: 'items',
      render: (row) => (
        <span className="text-[#5F6877] text-[12px]">
          {row.items?.length || row.order_items?.length || 1} items
        </span>
      ),
    },
    {
      header: 'Total Value',
      key: 'total',
      isNumeric: true,
      render: (row) => (
        <span className="font-mono tabular-nums font-semibold text-[#1B1D22]">
          GH₵ {Number(row.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Paid Amount',
      key: 'paid',
      isNumeric: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-[#1E7B50] font-medium">
          GH₵ {Number(row.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Payment Status',
      key: 'payment_status',
      render: (row) => (
        <MercuryBadge variant={row.payment_status}>
          {row.payment_status?.replace('_', ' ')}
        </MercuryBadge>
      ),
    },
    {
      header: 'Fulfillment',
      key: 'status',
      render: (row) => (
        <MercuryBadge variant={row.status === 'DELIVERED' ? 'success' : 'neutral'}>
          {row.status || 'PROCESSING'}
        </MercuryBadge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <MercuryButton
          size="sm"
          variant="secondary"
          onClick={() => setSelectedOrderId(row.id)}
        >
          Manage
        </MercuryButton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#1B1D22] tracking-tight mercury-title">
            Orders Management
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Monitor client orders, payment deadlines, and fulfillment progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MercuryButton
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchOrders}
            disabled={loading}
          >
            Refresh
          </MercuryButton>
          <MercuryButton
            variant="secondary"
            icon={Download}
            onClick={() => alert('Exporting orders CSV...')}
          >
            Export Orders
          </MercuryButton>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MercuryKpiCard
          label="Total Revenue Collected"
          value={`GH₵ ${totalRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          delta="+9.5%"
          deltaType="positive"
          deltaPeriod="settled"
          icon={ShoppingBag}
        />
        <MercuryKpiCard
          label="Outstanding Balances"
          value={`GH₵ ${totalOutstanding.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          delta={totalOutstanding > 0 ? 'Pending' : 'All clear'}
          deltaType={totalOutstanding > 0 ? 'neutral' : 'positive'}
          deltaPeriod="installment terms"
          icon={Clock}
        />
        <MercuryKpiCard
          label="Pending Processing"
          value={pendingCount}
          delta={pendingCount > 0 ? `${pendingCount} orders` : 'Zero backlog'}
          deltaType={pendingCount > 0 ? 'neutral' : 'positive'}
          deltaPeriod="awaiting dispatch"
          icon={Truck}
        />
        <MercuryKpiCard
          label="Delivered &amp; Complete"
          value={deliveredCount}
          delta="+14.2%"
          deltaType="positive"
          deltaPeriod="successful delivery"
          icon={CheckCircle2}
        />
      </div>

      {/* Search and Filters */}
      <MercuryCard padding="sm" className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <MercuryInput
              placeholder="Search by ID, customer name, phone or product..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-white border border-[#CDD1D8] rounded-[8px] h-9 px-3 gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#8B93A1]" strokeWidth={1.5} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-[12px] text-[#1B1D22] bg-transparent focus:outline-none"
              />
            </div>
            {filterDate && (
              <MercuryButton size="sm" variant="tertiary" onClick={() => setFilterDate('')}>
                Clear Date
              </MercuryButton>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 border-t border-[#F4F5F7]">
          {['ALL', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-[#EEF0FD] text-[#5266EB]'
                  : 'text-[#5F6877] hover:bg-[#F4F5F7]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </MercuryCard>

      {/* Orders Table */}
      <MercuryTable
        columns={columns}
        data={filteredOrders}
        keyField="id"
        isLoading={loading}
        selectedIds={selectedIds}
        onSelectRow={(id) =>
          setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
          )
        }
        onSelectAll={() =>
          setSelectedIds(
            selectedIds.length === filteredOrders.length
              ? []
              : filteredOrders.map((o) => o.id)
          )
        }
        bulkActions={
          <MercuryButton size="sm" variant="secondary">
            Print Packing Slips
          </MercuryButton>
        }
        emptyMessage="No orders match your filter criteria."
      />

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={fetchOrders}
        />
      )}
    </div>
  );
}
