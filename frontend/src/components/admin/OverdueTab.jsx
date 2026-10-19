import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';
import OrderDetailsModal from './OrderDetailsModal';
import MercuryCard from './mercury/MercuryCard';
import MercuryTable from './mercury/MercuryTable';
import MercuryButton from './mercury/MercuryButton';
import MercuryInput from './mercury/MercuryInput';
import MercuryBadge from './mercury/MercuryBadge';
import MercuryModal from './mercury/MercuryModal';

const fmt = (n) =>
  `GH₵ ${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function OverdueTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [viewOrderId, setViewOrderId] = useState(null);
  const [deadlineOrder, setDeadlineOrder] = useState(null);
  const [deadlineDays, setDeadlineDays] = useState(14);
  const [deadlinePct, setDeadlinePct] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders/overdue');
      setOrders(data || []);
    } catch {
      setError('Failed to load overdue orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const showMsg = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleApplyPenalty = async (orderId) => {
    try {
      await api.post(`/admin/orders/${orderId}/apply-penalty`);
      showMsg('Penalty successfully applied');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to apply penalty');
    }
  };

  const handleWaivePenalty = async (orderId) => {
    try {
      await api.post(`/admin/orders/${orderId}/waive-penalty`);
      showMsg('Penalty waived');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to waive penalty');
    }
  };

  const handleSetDeadline = async () => {
    if (!deadlineOrder) return;
    setSaving(true);
    try {
      const payload = { days: Number(deadlineDays) };
      if (deadlinePct) payload.penalty_pct = Number(deadlinePct);
      await api.post(`/admin/orders/${deadlineOrder.id}/set-deadline`, payload);
      showMsg('Deadline updated successfully');
      setDeadlineOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to set deadline');
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      String(order.id).toLowerCase().includes(q) ||
      (order.user?.email || '').toLowerCase().includes(q) ||
      (order.user?.name || '').toLowerCase().includes(q) ||
      (order.user?.phone || '').toLowerCase().includes(q);

    let matchesDate = true;
    if (filterDate && order.payment_deadline) {
      const d = new Date(order.payment_deadline).toISOString().split('T')[0];
      matchesDate = d === filterDate;
    }
    return matchesSearch && matchesDate;
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
          <div className="font-medium text-[#1B1D22]">{row.user?.name || 'Customer'}</div>
          <div className="text-[11px] text-[#8B93A1] font-mono">{row.user?.phone || row.user?.email || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Balance Due',
      key: 'balance',
      isNumeric: true,
      render: (row) => {
        const bal = Math.max(
          0,
          (row.total_price || 0) + (row.penalty_amount || 0) - (row.amount_paid || 0)
        );
        return (
          <span className="font-mono tabular-nums font-semibold text-[#C02B2B]">
            {fmt(bal)}
          </span>
        );
      },
    },
    {
      header: 'Deadline',
      key: 'deadline',
      render: (row) => (
        <span className="text-[12px] text-[#5F6877]">
          {row.payment_deadline
            ? new Date(row.payment_deadline).toLocaleDateString()
            : 'Unset'}
        </span>
      ),
    },
    {
      header: 'Penalty (5%)',
      key: 'penalty',
      render: (row) => (
        <MercuryBadge variant={row.penalty_applied ? 'danger' : 'neutral'}>
          {row.penalty_applied ? `+${fmt(row.penalty_amount)} Applied` : 'Not Applied'}
        </MercuryBadge>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <MercuryBadge variant="danger">Overdue</MercuryBadge>,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <MercuryButton
            size="sm"
            variant="secondary"
            onClick={() => {
              setDeadlineOrder(row);
              setDeadlineDays(14);
            }}
          >
            Extend Deadline
          </MercuryButton>

          {row.penalty_applied ? (
            <MercuryButton
              size="sm"
              variant="tertiary"
              onClick={() => handleWaivePenalty(row.id)}
            >
              Waive
            </MercuryButton>
          ) : (
            <MercuryButton
              size="sm"
              variant="destructive"
              onClick={() => handleApplyPenalty(row.id)}
            >
              Apply Penalty
            </MercuryButton>
          )}

          <MercuryButton
            size="sm"
            variant="secondary"
            onClick={() => setViewOrderId(row.id)}
          >
            View
          </MercuryButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#1B1D22] tracking-tight mercury-title">
            Overdue Balances &amp; Recovery
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Accounts past contractual payment deadline requiring penalty assessment or extensions
          </p>
        </div>

        {actionMsg && (
          <div className="p-2 px-3 bg-[#E8F5EE] border border-[#1E7B50]/20 rounded-[8px] text-[12px] text-[#1E7B50] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
            <span>{actionMsg}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <MercuryCard padding="sm" className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <MercuryInput
            placeholder="Search overdue orders, customer name or phone..."
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
              Clear
            </MercuryButton>
          )}
        </div>
      </MercuryCard>

      {/* Overdue Table */}
      <MercuryTable
        columns={columns}
        data={filteredOrders}
        keyField="id"
        isLoading={loading}
        emptyMessage="No overdue orders currently detected."
      />

      {/* Set Deadline Modal */}
      <MercuryModal
        isOpen={!!deadlineOrder}
        onClose={() => setDeadlineOrder(null)}
        title="Set Payment Deadline"
        description={`Configure an extended grace period for Order #${deadlineOrder?.id}`}
        footer={
          <>
            <MercuryButton variant="secondary" onClick={() => setDeadlineOrder(null)}>
              Cancel
            </MercuryButton>
            <MercuryButton variant="primary" onClick={handleSetDeadline} disabled={saving}>
              {saving ? 'Saving...' : 'Save Deadline'}
            </MercuryButton>
          </>
        }
      >
        <div className="space-y-4">
          <MercuryInput
            label="Additional Days Allowed"
            type="number"
            min="1"
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(e.target.value)}
            helper="Number of days from today before subsequent penalty triggers"
          />

          <MercuryInput
            label="Custom Penalty % (Optional)"
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 5"
            value={deadlinePct}
            onChange={(e) => setDeadlinePct(e.target.value)}
            helper="Leave blank to use default policy rule percentage"
          />
        </div>
      </MercuryModal>

      {/* Order Details Modal */}
      {viewOrderId && (
        <OrderDetailsModal
          orderId={viewOrderId}
          isOpen={!!viewOrderId}
          onClose={() => setViewOrderId(null)}
          onOrderUpdated={fetchOrders}
        />
      )}
    </div>
  );
}
