import React, { useState, useEffect, useCallback } from 'react';
import {
  XCircle,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Check,
  X,
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

export default function CancellationsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [viewOrderId, setViewOrderId] = useState(null);

  const [noteModal, setNoteModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const showMsg = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3500);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders/cancellations');
      setRequests(data || []);
    } catch {
      setError('Failed to load cancellation requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async () => {
    if (!noteModal) return;
    setSaving(true);
    try {
      const { reqId, action } = noteModal;
      await api.post(`/admin/orders/cancellations/${reqId}/${action}`, {
        admin_note: adminNote,
      });
      showMsg(`Cancellation ${action}d successfully`);
      setNoteModal(null);
      setAdminNote('');
      fetchRequests();
    } catch (e) {
      showMsg(e.response?.data?.error || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRefund = async (reqId) => {
    try {
      await api.post(`/admin/orders/cancellations/${reqId}/refund`);
      showMsg('Refund processed successfully');
      fetchRequests();
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to process refund');
    }
  };

  const filteredRequests = requests.filter((req) => {
    const order = req.order || {};
    const matchesSearch =
      String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.reason || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (filterDate) {
      const reqDate = new Date(req.created_at).toISOString().split('T')[0];
      matchesDate = reqDate === filterDate;
    }
    return matchesSearch && matchesDate;
  });

  const columns = [
    {
      header: 'Request',
      key: 'id',
      render: (row) => (
        <span className="font-mono text-[12px] font-medium text-[#1B1D22]">
          #{row.id}
        </span>
      ),
    },
    {
      header: 'Order & Customer',
      key: 'order',
      render: (row) => (
        <div>
          <div className="font-medium text-[#1B1D22]">Order #{row.order?.id}</div>
          <div className="text-[11px] text-[#8B93A1]">
            {row.order?.user?.email || 'Customer'}
          </div>
        </div>
      ),
    },
    {
      header: 'Cancellation Reason',
      key: 'reason',
      render: (row) => (
        <span className="text-[12px] text-[#5F6877] max-w-xs block truncate">
          {row.reason || 'Customer request'}
        </span>
      ),
    },
    {
      header: 'Fee & Refund Value',
      key: 'amounts',
      isNumeric: true,
      render: (row) => (
        <div>
          <div className="font-mono tabular-nums font-semibold text-[#1B1D22]">
            Refund: {fmt(row.refund_amount)}
          </div>
          <div className="text-[11px] text-[#8B93A1] font-mono">
            Fee ({row.cancellation_fee_pct}%): {fmt(row.fee_amount || 0)}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <MercuryBadge
          variant={
            row.status === 'APPROVED'
              ? 'info'
              : row.status === 'REFUNDED'
              ? 'success'
              : row.status === 'REJECTED'
              ? 'danger'
              : 'warning'
          }
        >
          {row.status}
        </MercuryBadge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.status === 'REQUESTED' && (
            <>
              <MercuryButton
                size="sm"
                variant="primary"
                icon={Check}
                onClick={() => setNoteModal({ reqId: row.id, action: 'approve' })}
              >
                Approve
              </MercuryButton>
              <MercuryButton
                size="sm"
                variant="destructive"
                icon={X}
                onClick={() => setNoteModal({ reqId: row.id, action: 'reject' })}
              >
                Reject
              </MercuryButton>
            </>
          )}

          {row.status === 'APPROVED' && (
            <MercuryButton
              size="sm"
              variant="secondary"
              icon={RotateCcw}
              onClick={() => handleRefund(row.id)}
            >
              Issue Refund
            </MercuryButton>
          )}

          <MercuryButton
            size="sm"
            variant="tertiary"
            onClick={() => setViewOrderId(row.order?.id)}
          >
            Order
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
            Cancellation &amp; Refund Requests
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Administer customer return tickets, fee deductions, and Paystack reversal credits
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
            placeholder="Search by order ID, reason or email..."
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

      {/* Requests Table */}
      <MercuryTable
        columns={columns}
        data={filteredRequests}
        keyField="id"
        isLoading={loading}
        emptyMessage="No cancellation requests logged."
      />

      {/* Note Modal */}
      <MercuryModal
        isOpen={!!noteModal}
        onClose={() => setNoteModal(null)}
        title={`${noteModal?.action === 'approve' ? 'Approve' : 'Reject'} Cancellation`}
        description="Include administrative rationale for the customer ticket audit record"
        footer={
          <>
            <MercuryButton variant="secondary" onClick={() => setNoteModal(null)}>
              Cancel
            </MercuryButton>
            <MercuryButton
              variant={noteModal?.action === 'approve' ? 'primary' : 'destructive'}
              onClick={handleAction}
              disabled={saving}
            >
              {saving ? 'Processing...' : 'Confirm Decision'}
            </MercuryButton>
          </>
        }
      >
        <MercuryInput
          label="Administrative Note"
          placeholder="e.g. Return inspection verified in warehouse / Policy period expired"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
        />
      </MercuryModal>

      {/* Order Details Modal */}
      {viewOrderId && (
        <OrderDetailsModal
          orderId={viewOrderId}
          isOpen={!!viewOrderId}
          onClose={() => setViewOrderId(null)}
          onOrderUpdated={fetchRequests}
        />
      )}
    </div>
  );
}
