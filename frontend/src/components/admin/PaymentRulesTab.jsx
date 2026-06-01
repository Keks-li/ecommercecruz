import { useState, useEffect } from 'react';
import api from '../../services/api';

const FREQ_OPTIONS = ['daily', 'weekly', 'monthly'];

export default function PaymentRulesTab() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentRule, setCurrentRule] = useState(null);
  const [form, setForm] = useState({});

  const fetchRules = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders/payment-rules');
      setRules(data);
    } catch (err) {
      setMsg('Failed to load payment rules');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentRule(null);
    setForm({
      name: '',
      is_default: false,
      default_deadline_days: 14,
      default_penalty_pct: 10,
      grace_period_days: 3,
      default_cancel_fee_pct: 15,
      enable_recurring: false,
      penalty_frequency: 'monthly',
      max_refund_days: 30,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setModalMode('edit');
    setCurrentRule(rule);
    setForm({ ...rule });
    setIsModalOpen(true);
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      alert('Rule name is required');
      return;
    }

    setSaving(true);
    setMsg('');
    try {
      const payload = {
        name: form.name.trim(),
        is_default: Boolean(form.is_default),
        default_deadline_days: Number(form.default_deadline_days),
        default_penalty_pct: parseFloat(form.default_penalty_pct),
        grace_period_days: Number(form.grace_period_days),
        default_cancel_fee_pct: parseFloat(form.default_cancel_fee_pct),
        enable_recurring: Boolean(form.enable_recurring),
        penalty_frequency: form.penalty_frequency || 'monthly',
        max_refund_days: Number(form.max_refund_days),
      };

      if (modalMode === 'add') {
        const { data } = await api.post('/admin/orders/payment-rules', payload);
        setRules(prev => [...prev, data]);
        setMsg('Payment rule created successfully!');
      } else {
        const { data } = await api.put(`/admin/orders/payment-rules/${currentRule.id}`, payload);
        setRules(prev => prev.map(r => r.id === data.id ? data : r));
        setMsg('Payment rule updated successfully!');
      }
      setIsError(false);
      setIsModalOpen(false);
      // Re-fetch to ensure all default toggles / count relations are perfectly synchronized
      fetchRules();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to save payment rule');
      setIsError(true);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 5000);
    }
  };

  const handleDelete = async (ruleId) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    if (rule.is_default) {
      alert('The default payment rule cannot be deleted.');
      return;
    }

    const prodCount = rule._count?.products || 0;
    const confirmMsg = prodCount > 0 
      ? `Warning: There are ${prodCount} products associated with "${rule.name}". If you delete this rule, these products will fall back to using the default rule. Do you wish to proceed?`
      : `Are you sure you want to delete "${rule.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/admin/orders/payment-rules/${ruleId}`);
      setRules(prev => prev.filter(r => r.id !== ruleId));
      setMsg('Payment rule deleted successfully!');
      setIsError(false);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to delete payment rule');
      setIsError(true);
    } finally {
      setTimeout(() => setMsg(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <div className="h-8 bg-slate-800 rounded-xl w-64" />
            <div className="h-4 bg-slate-800 rounded-xl w-96" />
          </div>
          <div className="w-32 h-10 bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const Field = ({ label, hint, children }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {hint && <p className="text-slate-500 text-[11px] leading-tight">{hint}</p>}
      {children}
    </div>
  );

  const Input = ({ field, type = 'number', ...rest }) => (
    <input
      type={type}
      value={form[field] ?? ''}
      onChange={e => set(field, type === 'number' ? e.target.value : e.target.value)}
      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 text-white rounded-xl text-sm focus:outline-none transition"
      {...rest}
    />
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Payment & Refund Rules</h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage named payment configurations and deadlines to apply to your products.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Rule
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${isError ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          {msg}
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule) => {
          const productCount = rule._count?.products || 0;
          return (
            <div 
              key={rule.id} 
              className={`bg-slate-900/60 border rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.01] transition-all shadow-xl shadow-black/10 ${
                rule.is_default 
                  ? 'border-indigo-500/50 ring-1 ring-indigo-500/20 bg-indigo-950/10' 
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {rule.name}
                      {rule.is_default && (
                        <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Applied to <span className="text-indigo-400 font-bold">{productCount}</span> {productCount === 1 ? 'product' : 'products'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t border-slate-800/80 pt-4 mb-6">
                  <div>
                    <span className="text-slate-500 text-xs block uppercase font-medium tracking-wider">Deadline</span>
                    <span className="text-slate-200 font-semibold">{rule.default_deadline_days} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block uppercase font-medium tracking-wider">Grace Period</span>
                    <span className="text-slate-200 font-semibold">{rule.grace_period_days} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block uppercase font-medium tracking-wider">Penalty Rate</span>
                    <span className="text-slate-200 font-semibold text-rose-400">{rule.default_penalty_pct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block uppercase font-medium tracking-wider">Cancellation Fee</span>
                    <span className="text-slate-200 font-semibold text-amber-400">{rule.default_cancel_fee_pct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block uppercase font-medium tracking-wider">Refund Window</span>
                    <span className="text-slate-200 font-semibold">{rule.max_refund_days} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block uppercase font-medium tracking-wider">Type</span>
                    <span className="text-slate-200 font-semibold uppercase text-xs">
                      {rule.enable_recurring ? `Recurring (${rule.penalty_frequency})` : 'One-Time'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-800/50 pt-4">
                <button
                  onClick={() => openEditModal(rule)}
                  className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Edit Rule
                </button>
                {!rule.is_default && (
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800/60 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {modalMode === 'add' ? 'Create Payment Rule' : `Edit Payment Rule: ${currentRule?.name}`}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Rule Name</label>
                <input
                  type="text"
                  required
                  value={form.name || ''}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Furniture Policy"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Deadline (days)" hint="Days until balance is due">
                  <Input field="default_deadline_days" min="1" required />
                </Field>
                <Field label="Grace Period (days)" hint="Extra days before penalty">
                  <Input field="grace_period_days" min="0" required />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Penalty Rate %" hint="Applied to remaining balance">
                  <Input field="default_penalty_pct" step="0.1" min="0" max="100" required />
                </Field>
                <Field label="Cancellation Fee %" hint="Deducted from refund total">
                  <Input field="default_cancel_fee_pct" step="0.1" min="0" max="100" required />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Max Refund Window" hint="Refund policy expiry (days)">
                  <Input field="max_refund_days" min="1" required />
                </Field>
                <Field label="Penalty Frequency" hint="Only applies if recurring">
                  <select
                    value={form.penalty_frequency || 'monthly'}
                    onChange={e => set('penalty_frequency', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                  </select>
                </Field>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-800/60">
                {/* Recurring switch */}
                <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-slate-200 text-xs font-bold block">Enable Recurring Penalties</span>
                    <span className="text-[10px] text-slate-500 leading-tight block max-w-[280px]">
                      Trigger penalty repeatedly based on frequency. Requires active background service.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('enable_recurring', !form.enable_recurring)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.enable_recurring ? 'bg-indigo-600' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.enable_recurring ? 'translate-x-6' : 'translate-x-1'}`}/>
                  </button>
                </div>

                {/* Default rule switch */}
                <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-indigo-400 text-xs font-bold block">Set as Default Rule</span>
                    <span className="text-[10px] text-slate-500 leading-tight block max-w-[280px]">
                      This rule will apply to any product that does not have an explicitly set payment rule override.
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={modalMode === 'edit' && currentRule?.is_default}
                    onClick={() => set('is_default', !form.is_default)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      form.is_default 
                        ? 'bg-indigo-600' 
                        : (modalMode === 'edit' && currentRule?.is_default) ? 'bg-indigo-800 opacity-60 cursor-not-allowed' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.is_default ? 'translate-x-6' : 'translate-x-1'}`}/>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
                >
                  {saving ? 'Saving...' : 'Save Payment Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
