import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const ACTION_STYLE = {
  ORDER_CREATED:          'bg-blue-500/10   text-blue-400   border-blue-500/20',
  BALANCE_PAYMENT:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SET_PAYMENT_DEADLINE:   'bg-indigo-500/10  text-indigo-400  border-indigo-500/20',
  PENALTY_APPLIED:        'bg-rose-500/10   text-rose-400   border-rose-500/20',
  PENALTY_WAIVED:         'bg-amber-500/10  text-amber-400  border-amber-500/20',
  CANCELLATION_REQUESTED: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  CANCELLATION_APPROVED:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLATION_REJECTED:  'bg-rose-500/10   text-rose-400   border-rose-500/20',
  REFUND_PROCESSED:       'bg-sky-500/10    text-sky-400    border-sky-500/20',
  PAYMENT_RULES_UPDATED:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export default function AuditLogTab() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [entity, setEntity]   = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 25 });
      if (entity) params.set('entity', entity);
      const { data } = await api.get(`/admin/orders/audit-logs?${params}`);
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [page, entity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const parseJson = (str) => { try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; } };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Audit Log</h2>
          <p className="text-slate-400 text-sm mt-0.5">Immutable record of all financial actions. {total} total entries.</p>
        </div>
        <div className="flex gap-2">
          <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500">
            <option value="">All Entities</option>
            <option value="Order">Order</option>
            <option value="PaymentRule">PaymentRule</option>
            <option value="CancellationRequest">CancellationRequest</option>
          </select>
          <button onClick={fetchLogs}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">{[...Array(6)].map((_,i) => <div key={i} className="h-14 bg-slate-800 rounded-xl"/>)}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <span className="material-symbols-outlined text-5xl">history</span>
          <p className="mt-3 font-medium">No audit events recorded yet.</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Time</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                  <th className="px-4 py-3 text-left font-semibold">Entity</th>
                  <th className="px-4 py-3 text-left font-semibold">User ID</th>
                  <th className="px-4 py-3 text-left font-semibold">IP</th>
                  <th className="px-4 py-3 text-left font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map(log => (
                  <>
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ACTION_STYLE[log.action] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {log.action.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {log.entity}{log.entity_id ? ` #${log.entity_id}` : ''}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{log.user_id ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{log.ip_address ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-indigo-400">
                        {(log.old_value || log.new_value) ? 'View ▾' : '—'}
                      </td>
                    </tr>
                    {expanded === log.id && (log.old_value || log.new_value) && (
                      <tr key={`${log.id}-detail`} className="bg-slate-900/80">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                            {log.old_value && (
                              <div>
                                <p className="text-rose-400 font-semibold mb-1">Old Value</p>
                                <pre className="text-slate-400 bg-slate-900 p-3 rounded-lg overflow-x-auto">{parseJson(log.old_value)}</pre>
                              </div>
                            )}
                            {log.new_value && (
                              <div>
                                <p className="text-emerald-400 font-semibold mb-1">New Value</p>
                                <pre className="text-slate-400 bg-slate-900 p-3 rounded-lg overflow-x-auto">{parseJson(log.new_value)}</pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition">
            Previous
          </button>
          <span className="text-sm text-slate-400">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
