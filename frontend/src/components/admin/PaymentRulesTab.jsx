import { useState, useEffect } from 'react';
import api from '../../services/api';

const FREQ_OPTIONS = ['daily', 'weekly', 'monthly'];

export default function PaymentRulesTab() {
  const [rules, setRules]     = useState(null);
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    api.get('/admin/orders/payment-rules')
      .then(({ data }) => { setRules(data); setForm(data); })
      .catch(() => setMsg('Failed to load payment rules'))
      .finally(() => setLoading(false));
  }, []);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const { data } = await api.put('/admin/orders/payment-rules', {
        default_deadline_days:  Number(form.default_deadline_days),
        default_penalty_pct:    parseFloat(form.default_penalty_pct),
        grace_period_days:      Number(form.grace_period_days),
        default_cancel_fee_pct: parseFloat(form.default_cancel_fee_pct),
        enable_recurring:       Boolean(form.enable_recurring),
        penalty_frequency:      form.penalty_frequency,
        max_refund_days:        Number(form.max_refund_days),
      });
      setRules(data); setForm(data);
      setMsg('Rules saved successfully!'); setIsError(false);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to save rules'); setIsError(true);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  if (loading) return <div className="h-64 bg-slate-800 animate-pulse rounded-2xl"/>;

  const Field = ({ label, hint, children }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {hint && <p className="text-xs text-slate-600">{hint}</p>}
      {children}
    </div>
  );

  const Input = ({ field, type='number', ...rest }) => (
    <input
      type={type}
      value={form[field] ?? ''}
      onChange={e => set(field, type === 'number' ? e.target.value : e.target.value)}
      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 text-white rounded-xl text-sm focus:outline-none transition"
      {...rest}
    />
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Payment & Refund Rules</h2>
        <p className="text-slate-400 text-sm mt-0.5">Configure global defaults for payment deadlines, penalties, and cancellation fees.</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl border text-sm font-medium ${isError ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          {msg}
        </div>
      )}

      {/* Payment Deadlines */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-slate-200 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-400 text-[20px]">schedule</span>
          Payment Deadline Defaults
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Default Deadline (days)" hint="Days from order creation until payment is due.">
            <Input field="default_deadline_days" min="1" />
          </Field>
          <Field label="Grace Period (days)" hint="Days after the deadline before penalty is triggered.">
            <Input field="grace_period_days" min="0" />
          </Field>
        </div>
      </section>

      {/* Penalty */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-slate-200 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-400 text-[20px]">warning</span>
          Overdue Penalty
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Default Penalty %" hint="Applied to outstanding balance when overdue.">
            <Input field="default_penalty_pct" step="0.1" min="0" max="100"/>
          </Field>
          <Field label="Penalty Frequency" hint="Frequency if recurring penalties are enabled.">
            <select
              value={form.penalty_frequency ?? 'monthly'}
              onChange={e => set('penalty_frequency', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            >
              {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
          <div className="flex-1">
            <p className="text-slate-200 text-sm font-semibold">Enable Recurring Penalties</p>
            <p className="text-slate-500 text-xs mt-0.5">
              ⚠️ Requires a background cron job. Toggle enables scheduling — automatic execution deferred until cron service is configured.
            </p>
          </div>
          <button
            type="button"
            onClick={() => set('enable_recurring', !form.enable_recurring)}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.enable_recurring ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.enable_recurring ? 'translate-x-7' : 'translate-x-1'}`}/>
          </button>
        </div>
      </section>

      {/* Cancellation */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-slate-200 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-[20px]">cancel</span>
          Cancellation & Refund Policy
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Cancellation Fee %" hint="Deducted from amount paid when calculating refund.">
            <Input field="default_cancel_fee_pct" step="0.1" min="0" max="100"/>
          </Field>
          <Field label="Max Refund Period (days)" hint="Orders older than this cannot be refunded.">
            <Input field="max_refund_days" min="1"/>
          </Field>
        </div>

        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 space-y-1">
          <p className="font-bold">Refund Formula Preview</p>
          {form.default_cancel_fee_pct != null && (
            <>
              <p>Cancellation Fee = Amount Paid × {form.default_cancel_fee_pct}%</p>
              <p>Refund Amount = Amount Paid − Cancellation Fee</p>
              <p className="text-slate-400">Example: GH₵1,000 paid → Fee GH₵{(1000 * form.default_cancel_fee_pct / 100).toFixed(2)} → Refund GH₵{(1000 - 1000 * form.default_cancel_fee_pct / 100).toFixed(2)}</p>
            </>
          )}
        </div>
      </section>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3.5 bg-[#c7e74c] hover:bg-[#b5d342] disabled:opacity-50 text-black font-bold rounded-2xl text-sm transition-all active:scale-[0.98]">
        {saving ? 'Saving Rules…' : 'Save Payment Rules'}
      </button>
    </div>
  );
}
