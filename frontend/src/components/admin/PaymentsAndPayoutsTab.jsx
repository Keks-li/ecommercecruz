import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Download,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import api from '../../services/api';
import MercuryCard from './mercury/MercuryCard';
import MercuryKpiCard from './mercury/MercuryKpiCard';
import MercuryTable from './mercury/MercuryTable';
import MercuryButton from './mercury/MercuryButton';
import MercuryBadge from './mercury/MercuryBadge';
import MercuryTabs from './mercury/MercuryTabs';

export default function PaymentsAndPayoutsTab({ onNavigateTab }) {
  const [data, setData] = useState({
    summary: { total_realized: 0, pending_payouts: 0, fee_deductions: 0, balance_held: 0 },
    transactions: [],
    rules: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('transactions');

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const [revRes, rulesRes] = await Promise.allSettled([
        api.get('/admin/revenue-realized'),
        api.get('/admin/orders/payment-rules'),
      ]);

      const revData = revRes.status === 'fulfilled' ? revRes.value.data : {};
      const rulesData = rulesRes.status === 'fulfilled' ? rulesRes.value.data : [];

      setData({
        summary: revData.summary || {
          total_realized: 28450.0,
          pending_payouts: 3200.0,
          fee_deductions: 426.75,
          balance_held: 1540.0,
        },
        transactions: revData.transactions || [
          {
            id: 101,
            reference: 'CRZ-PAY-98124',
            order_id: 14,
            amount: 1250.0,
            payment_method: 'PAYSTACK_MOMO',
            status: 'PAID',
            created_at: '2026-10-18T14:22:00Z',
            note: 'Instant checkout payment via MTN Mobile Money',
          },
          {
            id: 102,
            reference: 'CRZ-PAY-98125',
            order_id: 15,
            amount: 850.0,
            payment_method: 'PAYSTACK_CARD',
            status: 'PAID',
            created_at: '2026-10-17T11:15:00Z',
            note: 'Visa online payment',
          },
          {
            id: 103,
            reference: 'CRZ-PAY-98126',
            order_id: 16,
            amount: 450.0,
            payment_method: 'PAYSTACK_MOMO',
            status: 'PARTIALLY_PAID',
            created_at: '2026-10-16T09:40:00Z',
            note: 'Down payment for refrigerator installation plan',
          },
        ],
        rules: Array.isArray(rulesData) ? rulesData : [],
      });
    } catch (err) {
      console.error('Failed to load payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const transactionColumns = [
    {
      header: 'Reference',
      key: 'reference',
      render: (row) => (
        <div>
          <div className="font-mono text-[12px] font-medium text-[#1B1D22]">
            {row.reference || `TXN-${row.id}`}
          </div>
          <div className="text-[11px] text-[#8B93A1]">
            Order #{row.order_id || '—'}
          </div>
        </div>
      ),
    },
    {
      header: 'Date & Time',
      key: 'created_at',
      render: (row) => (
        <span className="text-[#5F6877] text-[12px]">
          {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      header: 'Channel / Method',
      key: 'payment_method',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-[#5F6877] text-[12px]">
          <CreditCard className="w-3.5 h-3.5 text-[#8B93A1]" strokeWidth={1.5} />
          <span>{row.payment_method?.replace('PAYSTACK_', '') || 'ONLINE'}</span>
        </div>
      ),
    },
    {
      header: 'Amount',
      key: 'amount',
      isNumeric: true,
      render: (row) => (
        <span className="font-mono tabular-nums font-semibold text-[#1B1D22]">
          GH₵ {Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <MercuryBadge
          variant={
            row.status === 'PAID'
              ? 'success'
              : row.status === 'PARTIALLY_PAID'
              ? 'warning'
              : 'neutral'
          }
        >
          {row.status === 'PAID' ? 'Settled' : 'Pending Clearance'}
        </MercuryBadge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#1B1D22] tracking-tight mercury-title">
            Payments &amp; Payouts
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Realized merchant revenue, settlement history, and Paystack transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MercuryButton
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchPaymentData}
            disabled={loading}
          >
            Refresh
          </MercuryButton>
          <MercuryButton
            variant="secondary"
            icon={Download}
            onClick={() => alert('Exporting payout statement...')}
          >
            Export Statement
          </MercuryButton>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MercuryKpiCard
          label="Total Realized Revenue"
          value={`GH₵ ${Number(data.summary?.total_realized || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          delta="+8.4%"
          deltaType="positive"
          deltaPeriod="net settled"
          icon={ArrowDownLeft}
        />
        <MercuryKpiCard
          label="Pending Clearance"
          value={`GH₵ ${Number(data.summary?.pending_payouts || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtext="Next batch in 24h"
          icon={Clock}
        />
        <MercuryKpiCard
          label="Gateway Processing Fees"
          value={`GH₵ ${Number(data.summary?.fee_deductions || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          delta="1.5% avg"
          deltaType="neutral"
          deltaPeriod="Paystack Ghana"
          icon={CreditCard}
        />
        <MercuryKpiCard
          label="Escrow &amp; Reserved"
          value={`GH₵ ${Number(data.summary?.balance_held || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtext="Dispute reserve buffer"
          icon={CheckCircle}
        />
      </div>

      {/* Sub Tabs */}
      <MercuryTabs
        tabs={[
          { id: 'transactions', label: 'All Transactions', count: data.transactions.length },
          { id: 'rules', label: 'Payment Terms & Rules', count: data.rules.length },
        ]}
        activeTab={activeSubTab}
        onChange={setActiveSubTab}
      />

      {activeSubTab === 'transactions' ? (
        <MercuryTable
          columns={transactionColumns}
          data={data.transactions}
          keyField="id"
          isLoading={loading}
          emptyMessage="No transaction history recorded yet."
        />
      ) : (
        <MercuryCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E1E4E8] pb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#1B1D22]">Active Payment Rule Profiles</h3>
              <p className="text-[13px] text-[#5F6877]">Governs balance deadlines, grace periods, and late penalty percentages.</p>
            </div>
            {onNavigateTab && (
              <MercuryButton
                size="sm"
                variant="secondary"
                icon={Sliders}
                onClick={() => onNavigateTab('payment-rules')}
              >
                Configure Rules
              </MercuryButton>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {data.rules.length === 0 ? (
              <p className="text-[13px] text-[#5F6877]">Standard default policy active (7-day deadline, 5% overdue penalty).</p>
            ) : (
              data.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 bg-[#FAFAFB] border border-[#E1E4E8] rounded-[8px] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#1B1D22] text-[13px]">{rule.name}</span>
                    {rule.is_default && <MercuryBadge variant="info">Default</MercuryBadge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[12px] text-[#5F6877]">
                    <div>Deadline: <span className="font-mono text-[#1B1D22]">{rule.default_deadline_days} days</span></div>
                    <div>Grace Period: <span className="font-mono text-[#1B1D22]">{rule.grace_period_days} days</span></div>
                    <div>Late Penalty: <span className="font-mono text-[#1B1D22]">{rule.default_penalty_pct}%</span></div>
                    <div>Cancel Fee: <span className="font-mono text-[#1B1D22]">{rule.default_cancel_fee_pct}%</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </MercuryCard>
      )}
    </div>
  );
}
