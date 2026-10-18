import { useState } from 'react';

const fmt = (n) => `GH₵ ${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const STATUS_PILL = {
  PENDING:        'bg-amber-500/10 text-amber-400 border-amber-500/30',
  PARTIALLY_PAID: 'bg-blue-500/10  text-blue-400  border-blue-500/30',
  PAID:           'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  OVERDUE:        'bg-rose-500/10  text-rose-400  border-rose-500/30',
  ACTIVE:         'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  SUSPENDED:      'bg-rose-500/10  text-rose-400  border-rose-500/30',
  REQUESTED:      'bg-amber-500/10 text-amber-400 border-amber-500/30',
  APPROVED:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  REJECTED:       'bg-rose-500/10  text-rose-400  border-rose-500/30',
  REFUNDED:       'bg-teal-500/10  text-teal-400  border-teal-500/30',
};

// Field label dictionary
const LABELS = {
  total: 'Order Total',
  total_price: 'Order Total',
  amountPaid: 'Amount Paid',
  amount_paid: 'Amount Paid',
  paymentStatus: 'Payment Status',
  payment_status: 'Payment Status',
  status: 'Status',
  payment_due_date: 'Payment Due Date',
  penalty_pct: 'Penalty Rate',
  penaltyPct: 'Penalty Rate',
  penalty_amount: 'Penalty Amount',
  penalty_applied: 'Penalty Applied',
  reason: 'Cancellation Reason',
  adminNote: 'Admin Note',
  admin_note: 'Admin Note',
  feePct: 'Cancellation Fee Rate',
  default_cancel_fee_pct: 'Cancellation Fee Rate',
  refundAmount: 'Refund Amount',
  refund_amount: 'Refund Amount',
  days: 'Deadline (Days)',
  default_deadline_days: 'Default Deadline',
  grace_period_days: 'Grace Period',
  default_penalty_pct: 'Default Penalty Rate',
  enable_recurring: 'Recurring Penalties',
  penalty_frequency: 'Penalty Frequency',
  max_refund_days: 'Max Refund Window',
};

function safeParse(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function ValueDisplay({ field, value }) {
  if (value === null || value === undefined) return <span className="text-slate-600 italic">None</span>;

  // Currency fields
  const isCurrency = /(total|amount|paid|fee_amount|refund)/i.test(field) && !/(pct|rate|days)/i.test(field);
  if (isCurrency && typeof value === 'number') {
    return <span className="font-bold text-white">{fmt(value)}</span>;
  }

  // Percentage fields
  const isPct = /(pct|rate)/i.test(field);
  if (isPct && (typeof value === 'number' || !isNaN(Number(value)))) {
    return <span className="font-semibold text-rose-400">{value}%</span>;
  }

  // Status fields
  const isStatus = /(status)/i.test(field);
  if (isStatus && typeof value === 'string') {
    const cls = STATUS_PILL[value] || 'bg-slate-800 text-slate-300 border-slate-700';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cls}`}>
        {value.replace(/_/g, ' ')}
      </span>
    );
  }

  // Date fields
  const isDate = /(date)/i.test(field);
  if (isDate && typeof value === 'string' && !isNaN(Date.parse(value))) {
    return <span className="font-semibold text-indigo-300">{new Date(value).toLocaleDateString()}</span>;
  }

  // Boolean fields
  if (typeof value === 'boolean') {
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${value ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  }

  // Array or object
  if (typeof value === 'object') {
    return <span className="font-mono text-xs text-slate-300">{JSON.stringify(value)}</span>;
  }

  return <span className="text-slate-200 font-medium">{String(value)}</span>;
}

export default function AuditLogDetails({ log, onOpenOrder }) {
  const [showRaw, setShowRaw] = useState(false);

  const oldData = safeParse(log.old_value);
  const newData = safeParse(log.new_value);

  const isOldObject = oldData && typeof oldData === 'object';
  const isNewObject = newData && typeof newData === 'object';

  // Extract all distinct keys
  const allKeys = Array.from(new Set([
    ...(isOldObject ? Object.keys(oldData) : []),
    ...(isNewObject ? Object.keys(newData) : []),
  ]));

  const prettyJson = (obj) => {
    try {
      return JSON.stringify(typeof obj === 'string' ? JSON.parse(obj) : obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Action Summary & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-300">
            {log.action.replace(/_/g, ' ')} on {log.entity} {log.entity_id ? `#${log.entity_id}` : ''}
          </span>
          {log.entity === 'Order' && log.entity_id && onOpenOrder && (
            <button
              onClick={() => onOpenOrder(log.entity_id)}
              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Full Order (#CRZ-{String(log.entity_id).padStart(5, '0')})
            </button>
          )}
        </div>

        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/60 transition"
        >
          {showRaw ? '👁️ View Clean Cards' : '{ } Raw JSON'}
        </button>
      </div>

      {/* Raw JSON View (if user toggles it) */}
      {showRaw ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          {oldData && (
            <div>
              <p className="text-rose-400 font-semibold mb-1">Old Value (JSON)</p>
              <pre className="text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto">
                {prettyJson(oldData)}
              </pre>
            </div>
          )}
          {newData && (
            <div>
              <p className="text-emerald-400 font-semibold mb-1">New Value (JSON)</p>
              <pre className="text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto">
                {prettyJson(newData)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* Human Readable Structured Diff Cards */
        <div className="space-y-3">
          {/* If it's a key-value object comparison */}
          {allKeys.length > 0 ? (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-inner">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Attribute</th>
                    {oldData && <th className="px-4 py-2.5 text-left font-semibold text-rose-400/90">Previous Value</th>}
                    {newData && <th className="px-4 py-2.5 text-left font-semibold text-emerald-400/90">Updated Value</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allKeys.map((key) => {
                    const oldVal = isOldObject ? oldData[key] : undefined;
                    const newVal = isNewObject ? newData[key] : undefined;
                    const isChanged = oldVal !== undefined && newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal);

                    return (
                      <tr key={key} className={`hover:bg-slate-800/30 transition-colors ${isChanged ? 'bg-indigo-500/5' : ''}`}>
                        <td className="px-4 py-2.5 font-medium text-slate-400 whitespace-nowrap">
                          {LABELS[key] || key.replace(/_/g, ' ')}
                          {isChanged && <span className="ml-2 text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Changed</span>}
                        </td>
                        {oldData && (
                          <td className="px-4 py-2.5">
                            <ValueDisplay field={key} value={oldVal} />
                          </td>
                        )}
                        {newData && (
                          <td className="px-4 py-2.5">
                            <ValueDisplay field={key} value={newVal} />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Text fallback if not an object */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {oldData && (
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-rose-400 font-bold mb-1">Previous</p>
                  <p className="text-slate-300">{String(oldData)}</p>
                </div>
              )}
              {newData && (
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-emerald-400 font-bold mb-1">Updated</p>
                  <p className="text-slate-300">{String(newData)}</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Note or Reason callout if available */}
          {(newData?.reason || newData?.adminNote || newData?.admin_note || newData?.note) && (
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
              <span className="font-bold shrink-0">Note / Reason:</span>
              <span className="italic">{newData.reason || newData.adminNote || newData.admin_note || newData.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
