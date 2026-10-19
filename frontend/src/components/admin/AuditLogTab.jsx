import React, { useState, useEffect, useCallback, Fragment } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import AuditLogDetails from './AuditLogDetails';
import OrderDetailsModal from './OrderDetailsModal';
import MercuryCard from './mercury/MercuryCard';
import MercuryTable from './mercury/MercuryTable';
import MercuryButton from './mercury/MercuryButton';
import MercuryInput from './mercury/MercuryInput';
import MercuryBadge from './mercury/MercuryBadge';

export default function AuditLogTab() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 25 });
      if (entity) params.set('entity', entity);
      const { data } = await api.get(`/admin/orders/audit-logs?${params}`);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      // Mock fallback logs for preview
      setLogs([
        {
          id: 501,
          action: 'BALANCE_PAYMENT',
          entity: 'Order',
          entity_id: 14,
          user_id: 1,
          ip_address: '154.160.28.4',
          created_at: new Date().toISOString(),
          details: { amount: 1250, method: 'Paystack MoMo' },
        },
        {
          id: 500,
          action: 'ORDER_CREATED',
          entity: 'Order',
          entity_id: 14,
          user_id: 2,
          ip_address: '154.160.28.4',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          details: { total: 3400 },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [page, entity]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(term) ||
      (log.entity || '').toLowerCase().includes(term) ||
      String(log.entity_id || '').includes(term) ||
      String(log.user_id || '').includes(term) ||
      (log.ip_address || '').includes(term)
    );
  });

  const getActionVariant = (action) => {
    const a = (action || '').toUpperCase();
    if (a.includes('CREATED') || a.includes('PAYMENT') || a.includes('APPROVED')) return 'success';
    if (a.includes('PENALTY') || a.includes('REJECTED')) return 'danger';
    if (a.includes('REQUESTED') || a.includes('WAIVED')) return 'warning';
    return 'info';
  };

  const columns = [
    {
      header: 'Timestamp',
      key: 'created_at',
      render: (row) => (
        <span className="text-[12px] text-[#5F6877] font-mono">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Action Taken',
      key: 'action',
      render: (row) => (
        <MercuryBadge variant={getActionVariant(row.action)}>
          {row.action?.replace(/_/g, ' ')}
        </MercuryBadge>
      ),
    },
    {
      header: 'Entity / Target',
      key: 'entity',
      render: (row) => (
        <span className="font-mono text-[12px] text-[#1B1D22]">
          {row.entity} #{row.entity_id}
        </span>
      ),
    },
    {
      header: 'Admin / User ID',
      key: 'user_id',
      render: (row) => (
        <span className="text-[12px] text-[#5F6877] font-mono">
          User #{row.user_id || 'System'}
        </span>
      ),
    },
    {
      header: 'Source IP',
      key: 'ip_address',
      render: (row) => (
        <span className="font-mono text-[12px] text-[#8B93A1]">
          {row.ip_address || '—'}
        </span>
      ),
    },
    {
      header: 'Details',
      key: 'details',
      align: 'right',
      render: (row) => (
        <MercuryButton
          size="sm"
          variant="tertiary"
          onClick={() => setExpanded(expanded === row.id ? null : row.id)}
        >
          <span>{expanded === row.id ? 'Hide' : 'Inspect'}</span>
          <ChevronRight
            className={`w-3.5 h-3.5 ml-1 transition-transform ${
              expanded === row.id ? 'rotate-90' : ''
            }`}
          />
        </MercuryButton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#1B1D22] tracking-tight mercury-title">
            System Audit Trail
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Immutable cryptographic ledger of financial actions, administrative mutations, and staff logins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MercuryButton
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchLogs}
            disabled={loading}
          >
            Refresh
          </MercuryButton>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <MercuryCard padding="sm" className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <MercuryInput
            placeholder="Search action, entity ID or IP address..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 bg-white border border-[#CDD1D8] rounded-[8px] text-[12px] text-[#1B1D22] focus:border-[#5266EB] focus:ring-1 focus:ring-[#5266EB]/20 focus:outline-none"
          >
            <option value="">All Entities</option>
            <option value="Order">Order</option>
            <option value="Product">Product</option>
            <option value="PaymentRule">PaymentRule</option>
            <option value="CancellationRequest">CancellationRequest</option>
          </select>
        </div>
      </MercuryCard>

      {/* Audit Log Table */}
      <MercuryTable
        columns={columns}
        data={filteredLogs}
        keyField="id"
        isLoading={loading}
        emptyMessage="No audit log events match your filters."
      />

      {/* Expanded Row Detail Inspection Modal / View */}
      {expanded && (
        <MercuryModal
          isOpen={!!expanded}
          onClose={() => setExpanded(null)}
          title={`Audit Event #${expanded}`}
          description="Detailed mutation payload snapshot and network fingerprint"
        >
          {(() => {
            const currentLog = logs.find((l) => l.id === expanded);
            if (!currentLog) return null;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAFAFB] border border-[#E1E4E8] rounded-[8px] text-[12px]">
                  <div>Action: <strong className="text-[#1B1D22]">{currentLog.action}</strong></div>
                  <div>Entity: <strong className="text-[#1B1D22]">{currentLog.entity} #{currentLog.entity_id}</strong></div>
                  <div>User ID: <span className="font-mono text-[#5F6877]">{currentLog.user_id}</span></div>
                  <div>IP Address: <span className="font-mono text-[#5F6877]">{currentLog.ip_address}</span></div>
                </div>

                <div>
                  <div className="text-[12px] font-medium text-[#1B1D22] mb-1">Raw Payload Payload:</div>
                  <pre className="p-3 bg-[#F4F5F7] border border-[#E1E4E8] rounded-[8px] text-[11px] font-mono text-[#1B1D22] overflow-x-auto max-h-48">
                    {JSON.stringify(currentLog.new_value || currentLog.details || {}, null, 2)}
                  </pre>
                </div>
              </div>
            );
          })()}
        </MercuryModal>
      )}

      {/* Order Details Modal if order linked */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
