import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import OrderDetailsModal from './OrderDetailsModal';

const fmt = (n) => `GH₵ ${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function RevenueRealizedTab({ onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Time scope filters
  const [timePreset, setTimePreset] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'
  const [customDate, setCustomDate] = useState('');

  // Table filter states
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'INFLOW' | 'REFUND'
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
      const { data: res } = await api.get(`/admin/revenue-realized${queryStr ? `?${queryStr}` : ''}`);
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
    netRealizedRevenue: 0,
    grossInflows: 0,
    totalRefunds: 0,
    totalContracted: 0,
    totalOutstanding: 0,
    totalPenalties: 0,
    realizationRate: 0,
    transactionCount: 0,
    fullyPaidCount: 0,
    partiallyPaidCount: 0,
    overdueCount: 0,
  };

  const transactions = data?.transactions || [];

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      String(tx.orderId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.note || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesType = true;
    if (typeFilter === 'INFLOW') matchesType = tx.amount > 0;
    else if (typeFilter === 'REFUND') matchesType = tx.amount < 0;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              ₵
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Revenue Realized</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Authoritative financial ledger of actual customer cash captured, installments realized, and refunds.
          </p>
        </div>

        {/* Time Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-1 text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: 'WEEK', label: 'Last 7 Days' },
              { id: 'MONTH', label: 'Last 30 Days' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => { setTimePreset(p.id); setCustomDate(''); }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timePreset === p.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date */}
          <div className="relative">
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                if (e.target.value) setTimePreset('CUSTOM');
                else setTimePreset('ALL');
              }}
              className="bg-slate-900/80 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/60 cursor-pointer"
            />
          </div>

          <button
            onClick={fetchData}
            title="Refresh Ledger"
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Net Realized Revenue */}
        <div className="bg-gradient-to-br from-emerald-950/20 via-slate-900/70 to-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 shadow-xl shadow-black/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Net Realized Revenue
              </span>
              <p className="text-3xl font-extrabold text-white tracking-tight">
                {fmt(summary.netRealizedRevenue)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Actual net cash settled</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              ✓
            </div>
          </div>
        </div>

        {/* Gross Cash Inflows */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Gross Inflows
              </span>
              <p className="text-3xl font-extrabold text-[#c7e74c] tracking-tight">
                {fmt(summary.grossInflows)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                From {summary.transactionCount} payment transactions
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#c7e74c]/10 border border-[#c7e74c]/20 flex items-center justify-center text-[#c7e74c] font-bold">
              ↓
            </div>
          </div>
        </div>

        {/* Refund Outflows */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                Refund Outflows
              </span>
              <p className="text-3xl font-extrabold text-rose-400 tracking-tight">
                {fmt(summary.totalRefunds)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Returned to customers</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
              ↑
            </div>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Pending Receivables
              </span>
              <p className="text-3xl font-extrabold text-amber-400 tracking-tight">
                {fmt(summary.totalOutstanding)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Owed across uncompleted orders</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              ⏳
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner (for primary dashboard oversight) */}
      {summary.lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/25 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-lg shrink-0">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-200">
                Critical Inventory Alert: {summary.lowStockCount} Products Low on Stock
              </h4>
              <p className="text-xs text-rose-400/90 mt-0.5">
                Items with less than 5 units remaining in inventory. Replenish soon to avoid order fulfillment delays.
              </p>
            </div>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('products')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/20 whitespace-nowrap self-end sm:self-auto"
            >
              Manage Inventory →
            </button>
          )}
        </div>
      )}

      {/* Secondary Analytics: Realization Progress & Payment Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Realization Progress Card */}
        <div className="lg:col-span-2 bg-[#0f1524] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-base tracking-tight">Realization Rate & Portfolio Quality</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Proportion of booked order contracts that have transitioned into cash.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm rounded-xl">
              {summary.realizationRate}% Realized
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700/60 flex">
              <div
                className="bg-gradient-to-r from-emerald-500 to-[#c7e74c] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(5, summary.realizationRate))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Realized: <strong className="text-emerald-400">{fmt(summary.grossInflows)}</strong></span>
              <span>Total Contracted: <strong className="text-slate-200">{fmt(summary.totalContracted)}</strong></span>
            </div>
          </div>

          {/* Order Payment Status Badges */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-center">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fully Settled</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block">{summary.fullyPaidCount} orders</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Partially Paid</span>
              <span className="text-lg font-bold text-blue-400 mt-1 block">{summary.partiallyPaidCount} orders</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Overdue</span>
              <span className="text-lg font-bold text-rose-400 mt-1 block">{summary.overdueCount} orders</span>
            </div>
          </div>
        </div>

        {/* Payment Channels Card */}
        <div className="bg-[#0f1524] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-white font-bold text-base tracking-tight">Payment Channels</h3>
          <p className="text-slate-400 text-xs">Gross cash captured per payment gateway / channel.</p>

          <div className="space-y-3 pt-2">
            {(!data?.methodBreakdown || Object.keys(data.methodBreakdown).length === 0) ? (
              <p className="text-slate-500 text-xs italic py-4 text-center">No payment methods recorded yet.</p>
            ) : (
              Object.entries(data.methodBreakdown).map(([method, amount]) => {
                const pct = summary.grossInflows > 0 ? ((amount / summary.grossInflows) * 100).toFixed(0) : 100;
                return (
                  <div key={method} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300 uppercase">{method}</span>
                      <span className="font-bold text-[#c7e74c]">{fmt(amount)}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 block text-right">{pct}% of inflows</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Realized Cash Transactions Ledger */}
      <div className="bg-[#0f1524] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Ledger Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-white font-bold text-lg tracking-tight">Cash Flow & Realization Ledger</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Live audit of all cash debits, customer deposits, installment payments, and refunds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Filter by Inflow vs Refund */}
            <div className="p-1 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${typeFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All ({transactions.length})
              </button>
              <button
                onClick={() => setTypeFilter('INFLOW')}
                className={`px-3 py-1.5 rounded-lg transition ${typeFilter === 'INFLOW' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Inflows (+)
              </button>
              <button
                onClick={() => setTypeFilter('REFUND')}
                className={`px-3 py-1.5 rounded-lg transition ${typeFilter === 'REFUND' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Refunds (-)
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Search order, email, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="border border-slate-800/80 rounded-xl overflow-hidden shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date & Time</th>
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Type & Note</th>
                  <th className="px-4 py-3 font-semibold text-right">Realized Amount</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      <span className="text-3xl block mb-2">🧾</span>
                      No realized transactions found for this scope.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isRefund = tx.amount < 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                          {new Date(tx.createdAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                          <button
                            onClick={() => setSelectedOrderId(tx.orderId)}
                            className="hover:text-indigo-400 transition-colors underline decoration-dotted"
                          >
                            #CRZ-{String(tx.orderId).padStart(5, '0')}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-300 max-w-[160px] truncate" title={tx.customerEmail}>
                          {tx.customerEmail}
                        </td>
                        <td className="px-4 py-3 font-semibold uppercase text-slate-400">
                          {tx.paymentMethod}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                          {tx.reference || '—'}
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mr-1.5 ${
                              isRefund
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {isRefund ? 'Refund' : 'Cash Inflow'}
                          </span>
                          <span className="text-slate-400 text-[11px]">{tx.note || 'Payment'}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold whitespace-nowrap text-sm">
                          <span className={isRefund ? 'text-rose-400' : 'text-[#c7e74c]'}>
                            {isRefund ? `- ${fmt(Math.abs(tx.amount))}` : `+ ${fmt(tx.amount)}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedOrderId(tx.orderId)}
                            className="px-2.5 py-1 bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition"
                          >
                            View Order
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
      </div>

      {/* Order Details Modal when clicking any transaction order */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={() => fetchData()}
        />
      )}
    </div>
  );
}
