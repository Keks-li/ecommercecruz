import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Percent,
} from 'lucide-react';
import api from '../../services/api';
import MercuryCard from './mercury/MercuryCard';
import MercuryButton from './mercury/MercuryButton';
import MercuryInput from './mercury/MercuryInput';
import MercuryBadge from './mercury/MercuryBadge';
import MercuryModal from './mercury/MercuryModal';

const FREQ_OPTIONS = ['daily', 'weekly', 'monthly'];

export default function PaymentRulesTab() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentRule, setCurrentRule] = useState(null);
  const [form, setForm] = useState({});

  const fetchRules = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders/payment-rules');
      setRules(data || []);
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
      min_deposit_pct: 20,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setModalMode('edit');
    setCurrentRule(rule);
    setForm({ ...rule });
    setIsModalOpen(true);
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

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
        min_deposit_pct: parseFloat(form.min_deposit_pct) || 20,
      };

      if (modalMode === 'add') {
        const { data } = await api.post('/admin/orders/payment-rules', payload);
        setRules((prev) => [...prev, data]);
        setMsg('Payment rule created successfully!');
      } else {
        const { data } = await api.put(
          `/admin/orders/payment-rules/${currentRule.id}`,
          payload
        );
        setRules((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        setMsg('Payment rule updated successfully!');
      }
      setIsError(false);
      setIsModalOpen(false);
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
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    if (rule.is_default) {
      alert('The default payment rule cannot be deleted.');
      return;
    }

    const prodCount = rule._count?.products || 0;
    const confirmMsg =
      prodCount > 0
        ? `Warning: There are ${prodCount} products associated with "${rule.name}". If you delete this rule, these products will fall back to using the default rule. Do you wish to proceed?`
        : `Are you sure you want to delete "${rule.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/admin/orders/payment-rules/${ruleId}`);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      setMsg('Payment rule deleted successfully!');
      setIsError(false);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to delete payment rule');
      setIsError(true);
    } finally {
      setTimeout(() => setMsg(''), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#1B1D22] tracking-tight mercury-title">
            Payment &amp; Refund Rules
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Configure installment terms, late penalty frequencies, and product policy profiles
          </p>
        </div>

        <MercuryButton variant="primary" icon={Plus} onClick={openAddModal}>
          New Payment Rule
        </MercuryButton>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-[8px] text-[12px] flex items-center gap-2 border ${
            isError
              ? 'bg-[#FBEAEA] text-[#C02B2B] border-[#C02B2B]/20'
              : 'bg-[#E8F5EE] text-[#1E7B50] border-[#1E7B50]/20'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          )}
          <span>{msg}</span>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <MercuryCard key={rule.id} className="space-y-4">
            <div className="flex items-start justify-between border-b border-[#E1E4E8] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-[#1B1D22]">{rule.name}</h3>
                  {rule.is_default && <MercuryBadge variant="info">Default Policy</MercuryBadge>}
                </div>
                <p className="text-[11px] text-[#8B93A1] mt-0.5 font-mono">
                  Linked Products: {rule._count?.products || 0} items
                </p>
              </div>

              <div className="flex items-center gap-1">
                <MercuryButton
                  size="sm"
                  variant="secondary"
                  icon={Edit2}
                  onClick={() => openEditModal(rule)}
                >
                  Edit
                </MercuryButton>
                {!rule.is_default && (
                  <MercuryButton
                    size="sm"
                    variant="destructive"
                    icon={Trash2}
                    onClick={() => handleDelete(rule.id)}
                  >
                    Delete
                  </MercuryButton>
                )}
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[12px]">
              <div className="p-2.5 bg-[#EEF0FD]/60 border border-[#5266EB]/20 rounded-[6px]">
                <span className="text-[#5266EB] block text-[11px] font-medium">Securing Deposit</span>
                <span className="font-mono text-[#1B1D22] font-bold">
                  {rule.min_deposit_pct ?? 20}%
                </span>
              </div>
              <div className="p-2.5 bg-[#FAFAFB] border border-[#E1E4E8] rounded-[6px]">
                <span className="text-[#8B93A1] block text-[11px]">Payment Deadline</span>
                <span className="font-mono text-[#1B1D22] font-semibold">
                  {rule.default_deadline_days} days
                </span>
              </div>
              <div className="p-2.5 bg-[#FAFAFB] border border-[#E1E4E8] rounded-[6px]">
                <span className="text-[#8B93A1] block text-[11px]">Grace Period</span>
                <span className="font-mono text-[#1B1D22] font-semibold">
                  {rule.grace_period_days} days
                </span>
              </div>
              <div className="p-2.5 bg-[#FAFAFB] border border-[#E1E4E8] rounded-[6px]">
                <span className="text-[#8B93A1] block text-[11px]">Overdue Penalty</span>
                <span className="font-mono text-[#C02B2B] font-semibold">
                  {rule.default_penalty_pct}% ({rule.penalty_frequency || 'one-off'})
                </span>
              </div>
              <div className="p-2.5 bg-[#FAFAFB] border border-[#E1E4E8] rounded-[6px]">
                <span className="text-[#8B93A1] block text-[11px]">Cancellation Fee</span>
                <span className="font-mono text-[#B26B00] font-semibold">
                  {rule.default_cancel_fee_pct}% of total
                </span>
              </div>
            </div>
          </MercuryCard>
        ))}
      </div>

      {/* Editor Modal */}
      <MercuryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Create Payment Rule' : 'Edit Payment Rule'}
        description="Establish contractual payment schedules, penalties, and cancellation fee thresholds"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <MercuryInput
            label="Rule Name"
            required
            value={form.name || ''}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Standard 14-Day Layaway"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MercuryInput
              label="Securing Deposit (%)"
              type="number"
              step="0.1"
              min="1"
              max="100"
              required
              value={form.min_deposit_pct ?? 20}
              onChange={(e) => set('min_deposit_pct', e.target.value)}
            />
            <MercuryInput
              label="Deadline (Days)"
              type="number"
              min="1"
              required
              value={form.default_deadline_days ?? 14}
              onChange={(e) => set('default_deadline_days', e.target.value)}
            />
            <MercuryInput
              label="Grace Period (Days)"
              type="number"
              min="0"
              required
              value={form.grace_period_days ?? 3}
              onChange={(e) => set('grace_period_days', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MercuryInput
              label="Penalty Percentage (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              value={form.default_penalty_pct ?? 10}
              onChange={(e) => set('default_penalty_pct', e.target.value)}
            />
            <MercuryInput
              label="Cancellation Fee (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              value={form.default_cancel_fee_pct ?? 15}
              onChange={(e) => set('default_cancel_fee_pct', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_default"
              checked={Boolean(form.is_default)}
              onChange={(e) => set('is_default', e.target.checked)}
              className="w-4 h-4 rounded-[4px] border-[#CDD1D8] text-[#5266EB] accent-[#5266EB] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="is_default" className="text-[13px] text-[#1B1D22] cursor-pointer">
              Set as storewide default payment rule
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E1E4E8]">
            <MercuryButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </MercuryButton>
            <MercuryButton variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Payment Rule'}
            </MercuryButton>
          </div>
        </form>
      </MercuryModal>
    </div>
  );
}
