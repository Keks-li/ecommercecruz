import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const fmt = (n) => `GH₵ ${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const STATUS_STYLE = {
  REQUESTED: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  APPROVED:  'bg-blue-500/10   text-blue-400   border-blue-500/20',
  REJECTED:  'bg-rose-500/10   text-rose-400   border-rose-500/20',
  REFUNDED:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function CancellationsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Note modal
  const [noteModal, setNoteModal] = useState(null); // { reqId, action }
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving]       = useState(false);

  const showMsg = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3500); };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders/cancellations');
      setRequests(data);
    } catch { setError('Failed to load cancellation requests'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async () => {
    if (!noteModal) return;
    setSaving(true);
    try {
      const { reqId, action } = noteModal;
      await api.post(`/admin/orders/cancellations/${reqId}/${action}`, { admin_note: adminNote });
      showMsg(`Cancellation ${action}d successfully`);
      setNoteModal(null); setAdminNote('');
      fetchRequests();
    } catch (e) { showMsg(e.response?.data?.error || 'Action failed'); }
    finally { setSaving(false); }
  };

  const handleRefund = async (reqId) => {
    try {
      await api.post(`/admin/orders/cancellations/${reqId}/refund`);
      showMsg('Refund processed');
      fetchRequests();
    } catch (e) { showMsg(e.response?.data?.error || 'Failed to process refund'); }
  };

  if (loading) return <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-800 rounded-2xl"/>)}</div>;
  if (error) return <div className="text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/30">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Cancellation Requests</h2>
          <p className="text-slate-400 text-sm mt-0.5">Review, approve, or reject customer cancellation requests.</p>
        </div>
        {actionMsg && <div className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-xl">{actionMsg}</div>}
      </div>

      {requests.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <span className="material-symbols-outlined text-5xl">inbox</span>
          <p className="mt-3 font-medium">No cancellation requests yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {requests.map(req => {
          const order = req.order;
          return (
            <div key={req.id} className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold font-mono">#CRZ-{String(order.id).padStart(5,'0')}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLE[req.status]}`}>{req.status}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{order.user?.email}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Requested: {new Date(req.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Amount Paid</p>
                  <p className="text-white font-bold">{fmt(order.amount_paid)}</p>
                  <p className="text-xs text-rose-400 mt-0.5">Fee {req.cancellation_fee_pct}% = {fmt(order.amount_paid * req.cancellation_fee_pct / 100)}</p>
                  <p className="text-[#c7e74c] font-bold text-sm">Refund: {fmt(req.refund_amount)}</p>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Customer Reason: </span>{req.reason}
              </div>

              {req.admin_note && (
                <div className="bg-indigo-500/5 rounded-xl p-3 text-xs text-indigo-300 border border-indigo-500/20">
                  <span className="font-semibold">Admin Note: </span>{req.admin_note}
                </div>
              )}

              {/* Order items summary */}
              <div className="text-xs text-slate-500">
                Items: {order.items?.map(i => `${i.product?.name} ×${i.quantity}`).join(', ')}
              </div>

              {req.status === 'REQUESTED' && (
                <div className="flex gap-2 flex-wrap pt-1">
                  <button onClick={() => { setNoteModal({ reqId: req.id, action: 'approve' }); setAdminNote(''); }}
                    className="px-4 py-1.5 text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg transition">
                    ✓ Approve
                  </button>
                  <button onClick={() => { setNoteModal({ reqId: req.id, action: 'reject' }); setAdminNote(''); }}
                    className="px-4 py-1.5 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition">
                    ✕ Reject
                  </button>
                </div>
              )}

              {req.status === 'APPROVED' && (
                <button onClick={() => handleRefund(req.id)}
                  className="px-4 py-1.5 text-xs font-bold bg-[#c7e74c]/15 hover:bg-[#c7e74c]/25 border border-[#c7e74c]/30 text-[#c7e74c] rounded-lg transition">
                  💸 Mark Refund Processed
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f1524] border border-slate-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-5">
            <h3 className="text-white font-bold text-lg capitalize">{noteModal.action} Cancellation</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase">Admin Note (optional)</label>
              <textarea rows={3} value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder="Add a note for the customer or internal record…"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"/>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAction} disabled={saving}
                className={`flex-1 py-2.5 font-bold rounded-xl text-sm disabled:opacity-50 ${noteModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}>
                {saving ? 'Processing…' : `Confirm ${noteModal.action.charAt(0).toUpperCase()+noteModal.action.slice(1)}`}
              </button>
              <button onClick={() => { setNoteModal(null); setAdminNote(''); }}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-700">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
