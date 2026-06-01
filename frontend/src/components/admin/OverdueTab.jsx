import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const fmt = (n) => `GH₵ ${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const daysUntil = (d) => {
  const diff = new Date(d) - new Date();
  return Math.ceil(diff / 86400000);
};

function Badge({ status }) {
  const map = {
    PENDING:        'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PARTIALLY_PAID: 'bg-blue-500/10  text-blue-400  border-blue-500/20',
    PAID:           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    OVERDUE:        'bg-rose-500/10  text-rose-400  border-rose-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${map[status] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

export default function OverdueTab() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Expanded order id for history modal
  const [historyOrderId, setHistoryOrderId] = useState(null);
  const [historyData, setHistoryData]       = useState(null);

  // Set deadline modal state
  const [deadlineOrder, setDeadlineOrder]   = useState(null);
  const [deadlineDays, setDeadlineDays]     = useState(14);
  const [deadlinePct, setDeadlinePct]       = useState('');
  const [saving, setSaving]                 = useState(false);
  const [actionMsg, setActionMsg]           = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders/overdue');
      setOrders(data);
    } catch { setError('Failed to load overdue orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const showMsg = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const handleApplyPenalty = async (orderId) => {
    try {
      await api.post(`/admin/orders/${orderId}/apply-penalty`);
      showMsg('Penalty applied successfully');
      fetchOrders();
    } catch (e) { showMsg(e.response?.data?.error || 'Failed to apply penalty'); }
  };

  const handleWaivePenalty = async (orderId) => {
    try {
      await api.post(`/admin/orders/${orderId}/waive-penalty`);
      showMsg('Penalty waived');
      fetchOrders();
    } catch (e) { showMsg(e.response?.data?.error || 'Failed to waive penalty'); }
  };

  const handleSetDeadline = async () => {
    setSaving(true);
    try {
      await api.post(`/admin/orders/${deadlineOrder}/set-deadline`, {
        days: deadlineDays,
        penaltyPct: deadlinePct !== '' ? Number(deadlinePct) : undefined,
      });
      showMsg('Deadline set successfully');
      setDeadlineOrder(null);
      fetchOrders();
    } catch (e) { showMsg(e.response?.data?.error || 'Failed to set deadline'); }
    finally { setSaving(false); }
  };

  const openHistory = async (orderId) => {
    setHistoryOrderId(orderId);
    try {
      const { data } = await api.get(`/admin/orders/${orderId}/payment-history`);
      setHistoryData(data);
    } catch { setHistoryData(null); }
  };

  // Perform filtering
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.payment_status || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (filterDate) {
      if (!order.payment_due_date) {
        matchesDate = false;
      } else {
        const dueDate = new Date(order.payment_due_date).toISOString().split('T')[0];
        matchesDate = dueDate === filterDate;
      }
    }

    return matchesSearch && matchesDate;
  });

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-48 bg-slate-800 rounded-lg"></div>
      <div className="h-10 bg-slate-800 rounded-xl"></div>
      {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-2xl"/>)}
    </div>
  );

  if (error) return <div className="text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/30">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Overdue Orders</h2>
          <p className="text-slate-400 text-sm mt-0.5">Orders past their payment deadline or requiring a deadline to be set.</p>
        </div>
        {actionMsg && <div className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-xl">{actionMsg}</div>}
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
            placeholder="Search by Order ID, customer, or payment status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/50 text-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-2">
            <span className="text-slate-500 text-xs font-semibold whitespace-nowrap">Due Date:</span>
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

      {filteredOrders.length === 0 && (
        <div className="text-center py-16 text-slate-500 bg-slate-900/20 border border-slate-800 rounded-2xl">
          <span className="material-symbols-outlined text-5xl">check_circle</span>
          <p className="mt-3 font-medium">No overdue orders matching filters.</p>
        </div>
      )}

      <div className="space-y-4">
        {filteredOrders.map(order => {
          const outstanding = order.total_price + order.penalty_amount - order.amount_paid;
          const daysLate = order.payment_due_date ? -daysUntil(order.payment_due_date) : null;
          return (
            <div key={order.id} className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex flex-wrap gap-3 justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold font-mono">#CRZ-{String(order.id).padStart(5,'0')}</p>
                    <Badge status={order.payment_status} />
                    {order.penalty_applied && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-bold">PENALTY APPLIED</span>}
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{order.user?.email}</p>
                  {order.payment_due_date && (
                    <p className={`text-xs font-semibold mt-1 ${daysLate > 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {daysLate > 0 ? `${daysLate} day${daysLate>1?'s':''} overdue` : 'Due today'}
                      {' — '}{new Date(order.payment_due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs text-slate-500">Order Total</p>
                  <p className="text-white font-bold">{fmt(order.total_price)}</p>
                  {order.penalty_amount > 0 && <p className="text-rose-400 text-xs font-semibold">+ {fmt(order.penalty_amount)} penalty</p>}
                  <p className="text-amber-400 font-bold text-sm">Outstanding: {fmt(outstanding)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => { setDeadlineOrder(order.id); setDeadlineDays(14); setDeadlinePct(''); }}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg transition">
                  Set Deadline
                </button>
                {!order.penalty_applied ? (
                  <button onClick={() => handleApplyPenalty(order.id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition">
                    Apply Penalty
                  </button>
                ) : (
                  <button onClick={() => handleWaivePenalty(order.id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg transition">
                    Waive Penalty
                  </button>
                )}
                <button onClick={() => openHistory(order.id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition">
                  Payment History
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Deadline Modal */}
      {deadlineOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f1524] border border-slate-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-5">
            <h3 className="text-white font-bold text-lg">Set Payment Deadline</h3>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Days Until Due</label>
                <input type="number" min="1" value={deadlineDays} onChange={e => setDeadlineDays(Number(e.target.value))}
                  className="mt-1 w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-indigo-500 text-sm"/>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Penalty % (optional override)</label>
                <input type="number" min="0" max="100" step="0.1" value={deadlinePct} onChange={e => setDeadlinePct(e.target.value)}
                  placeholder="Uses global default if blank"
                  className="mt-1 w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-600"/>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSetDeadline} disabled={saving}
                className="flex-1 py-2.5 bg-[#c7e74c] hover:bg-[#b5d342] text-black font-bold rounded-xl text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Confirm Deadline'}
              </button>
              <button onClick={() => setDeadlineOrder(null)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {historyOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { setHistoryOrderId(null); setHistoryData(null); }}>
          <div className="bg-[#0f1524] border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Payment History — #CRZ-{String(historyOrderId).padStart(5,'0')}</h3>
              <button onClick={() => { setHistoryOrderId(null); setHistoryData(null); }} className="text-slate-500 hover:text-slate-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {!historyData ? (
              <div className="text-slate-500 text-center py-8">Loading…</div>
            ) : historyData.transactions?.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No payment transactions recorded.</div>
            ) : (
              <div className="space-y-3">
                {historyData.transactions?.map(tx => (
                  <div key={tx.id} className={`flex justify-between items-center p-4 rounded-xl border ${tx.amount < 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-900/60 border-slate-800'}`}>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">{tx.payment_method}</p>
                      {tx.note && <p className="text-xs text-slate-500 mt-0.5">{tx.note}</p>}
                      <p className="text-xs text-slate-600 mt-0.5">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                    <p className={`font-bold text-sm ${tx.amount < 0 ? 'text-rose-400' : 'text-[#c7e74c]'}`}>{fmt(Math.abs(tx.amount))}{tx.amount < 0 ? ' (Refund)' : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
