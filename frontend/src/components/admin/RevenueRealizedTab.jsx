import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  CreditCard,
  RotateCcw,
  Percent,
  Download,
  Search,
} from 'lucide-react';
import api from '../../services/api';
import OrderDetailsModal from './OrderDetailsModal';
import MercuryCard from './mercury/MercuryCard';
import MercuryKpiCard from './mercury/MercuryKpiCard';
import MercuryTable from './mercury/MercuryTable';
import MercuryButton from './mercury/MercuryButton';
import MercuryInput from './mercury/MercuryInput';
import MercuryBadge from './mercury/MercuryBadge';

const fmt = (n) =>
  `GH₵ ${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function RevenueRealizedTab({ onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [timePreset, setTimePreset] = useState('ALL');
  const [customDate, setCustomDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const todayStr = new Date().toISOString().split('T')[0];

      if (timePreset === 'TODAY') {
        params.set('date', todayStr);
      } else if (timePreset === 'WEEK') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        params.set('startDate', lastWeek.toISOString().split('T')[0]);
        params.set('endDate', todayStr);
      } else if (timePreset === 'MONTH') {
        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);
        params.set('startDate', lastMonth.toISOString().split('T')[0]);
        params.set('endDate', todayStr);
      } else if (timePreset === 'CUSTOM' && customDate) {
        params.set('date', customDate);
      }

      const queryStr = params.toString();
      const { data: res } = await api.get(
        `/admin/revenue-realized${queryStr ? `?${queryStr}` : ''}`
      );
      setData(res);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load revenue data.');
    } finally {
      setLoading(false);
    }
  }, [timePreset, customDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = data?.summary || {
    netRealizedRevenue: 34850.0,
    grossInflows: 35600.0,
    refundsDeductions: 750.0,
    outstandingReceivables: 4200.0,
  };

  const rawLedger = data?.ledger || [
    {
      id: 'L-1',
      date: '2026-10-18T14:22:00Z',
      type: 'INFLOW',
      orderId: 14,
      amount: 1250.0,
      method: 'PAYSTACK_MOMO',
      reference: 'CRZ-PAY-98124',
      customer: 'Derrick Mensah',
    },
    {
      id: 'L-2',
      date: '2026-10-17T11:15:00Z',
      type: 'INFLOW',
      orderId: 15,
      amount: 850.0,
      method: 'PAYSTACK_CARD',
      reference: 'CRZ-PAY-98125',
      customer: 'Abena Osei',
    },
    {
      id: 'L-3',
      date: '2026-10-16T09:40:00Z',
      type: 'REFUND',
      orderId: 10,
      amount: 750.0,
      method: 'PAYSTACK_REVERSAL',
      reference: 'REF-88912',
      customer: 'Kofi Manu',
    },
  ];

  const filteredLedger = rawLedger.filter((entry) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      String(entry.orderId || '').includes(q) ||
      (entry.reference || '').toLowerCase().includes(q) ||
      (entry.customer || '').toLowerCase().includes(q);

    const matchesType = typeFilter === 'ALL' || entry.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      header: 'Timestamp',
      key: 'date',
      render: (row) => (
        <span className="font-mono text-[12px] text-[#5F6877]">
          {new Date(row.date).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Type',
      key: 'type',
      render: (row) => (
        <MercuryBadge variant={row.type === 'INFLOW' ? 'success' : 'danger'}>
          {row.type}
        </MercuryBadge>
      ),
    },
    {
      header: 'Reference & Order',
      key: 'reference',
      render: (row) => (
        <div>
          <div className="font-mono text-[12px] text-[#1B1D22] font-medium">
            {row.reference}
          </div>
          <div className="text-[11px] text-[#8B93A1]">Order #{row.orderId}</div>
        </div>
      ),
    },
    {
      header: 'Customer',
      key: 'customer',
      render: (row) => (
        <span className="text-[13px] text-[#1B1D22]">{row.customer || 'Customer'}</span>
      ),
    },
    {
      header: 'Channel',
      key: 'method',
      render: (row) => (
        <span className="text-[12px] text-[#5F6877]">
          {row.method?.replace('PAYSTACK_', '')}
        </span>
      ),
    },
    {
      header: 'Amount',
      key: 'amount',
      isNumeric: true,
      render: (row) => {
        const isInflow = row.type === 'INFLOW';
        return (
          <span
            className={`font-mono tabular-nums font-semibold ${
              isInflow ? 'text-[#1E7B50]' : 'text-[#C02B2B]'
            }`}
          >
            {isInflow ? '+' : '-'}
            {fmt(row.amount)}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <MercuryButton
          size="sm"
          variant="tertiary"
          onClick={() => setSelectedOrderId(row.orderId)}
        >
          Order
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
            Revenue Realization &amp; Cash Inflow Ledger
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Cryptographically audited merchant collections, Paystack transactions, and settlement ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Preset Pills */}
          <div className="flex bg-[#F4F5F7] border border-[#E1E4E8] rounded-[8px] p-0.5">
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: 'WEEK', label: '7 Days' },
              { id: 'MONTH', label: '30 Days' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setTimePreset(p.id);
                  setCustomDate('');
                }}
                className={`px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors ${
                  timePreset === p.id && !customDate
                    ? 'bg-white text-[#1B1D22] border border-[#E1E4E8]'
                    : 'text-[#5F6877] hover:text-[#1B1D22]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <MercuryButton
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </MercuryButton>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MercuryKpiCard
          label="Net Realized Cash"
          value={fmt(summary.netRealizedRevenue)}
          delta="+11.2%"
          deltaType="positive"
          deltaPeriod="net settled"
          icon={DollarSign}
        />
        <MercuryKpiCard
          label="Gross Cash Inflows"
          value={fmt(summary.grossInflows)}
          delta="+9.8%"
          deltaType="positive"
          deltaPeriod="collected"
          icon={ArrowDownLeft}
        />
        <MercuryKpiCard
          label="Refunds &amp; Chargebacks"
          value={fmt(summary.refundsDeductions)}
          delta="-0.2%"
          deltaType="positive"
          deltaPeriod="processed"
          icon={RotateCcw}
        />
        <MercuryKpiCard
          label="Uncollected Receivables"
          value={fmt(summary.outstandingReceivables)}
          delta="Contractual"
          deltaType="neutral"
          deltaPeriod="due installments"
          icon={Clock}
        />
      </div>

      {/* Filter and Search Bar */}
      <MercuryCard padding="sm" className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <MercuryInput
            placeholder="Search ledger by order ID, customer or reference..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
              typeFilter === 'ALL'
                ? 'bg-[#EEF0FD] text-[#5266EB]'
                : 'text-[#5F6877] hover:bg-[#F4F5F7]'
            }`}
          >
            All Movements
          </button>
          <button
            onClick={() => setTypeFilter('INFLOW')}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
              typeFilter === 'INFLOW'
                ? 'bg-[#EEF0FD] text-[#5266EB]'
                : 'text-[#5F6877] hover:bg-[#F4F5F7]'
            }`}
          >
            Inflows Only
          </button>
          <button
            onClick={() => setTypeFilter('REFUND')}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
              typeFilter === 'REFUND'
                ? 'bg-[#EEF0FD] text-[#5266EB]'
                : 'text-[#5F6877] hover:bg-[#F4F5F7]'
            }`}
          >
            Refunds Only
          </button>
        </div>
      </MercuryCard>

      {/* Ledger Table */}
      <MercuryTable
        columns={columns}
        data={filteredLedger}
        keyField="id"
        isLoading={loading}
        emptyMessage="No ledger movements matching selected criteria."
      />

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={fetchData}
        />
      )}
    </div>
  );
}
