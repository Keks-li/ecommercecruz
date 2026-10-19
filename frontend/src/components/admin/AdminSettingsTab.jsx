import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  KeyRound,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import MercuryCard from './mercury/MercuryCard';
import MercuryButton from './mercury/MercuryButton';
import MercuryInput from './mercury/MercuryInput';
import MercuryBadge from './mercury/MercuryBadge';
import MercuryTabs from './mercury/MercuryTabs';
import PaymentRulesTab from './PaymentRulesTab';
import AuditLogTab from './AuditLogTab';
import CancellationsTab from './CancellationsTab';

export default function AdminSettingsTab() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  const [activeSubTab, setActiveSubTab] = useState('account');

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [previewLink, setPreviewLink] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setPreviewLink('');

    if (!newEmail.trim()) {
      setEmailError('Please enter a new email address.');
      return;
    }
    if (newEmail.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setEmailError('Confirmation email does not match.');
      return;
    }
    if (!emailCurrentPassword) {
      setEmailError('Please enter your current password.');
      return;
    }

    setEmailLoading(true);
    try {
      const { data } = await api.post('/admin/change-email', {
        newEmail: newEmail.trim().toLowerCase(),
        currentPassword: emailCurrentPassword,
      });

      setEmailSuccess(
        data.message || `Confirmation link sent to ${newEmail}. Please click to activate.`
      );
      if (data.confirmationUrl) setPreviewLink(data.confirmationUrl);
      setNewEmail('');
      setConfirmEmail('');
      setEmailCurrentPassword('');
    } catch (err) {
      setEmailError(err.response?.data?.error || 'Failed to dispatch email confirmation.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please provide your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const { data } = await api.post('/admin/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(data.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-[20px] font-medium text-[#1B1D22] tracking-tight mercury-title">
          Settings &amp; Administration
        </h1>
        <p className="text-[13px] text-[#5F6877] mt-0.5">
          Configure security credentials, payment policies, cancellations, and immutable audit logs
        </p>
      </div>

      {/* Tabs */}
      <MercuryTabs
        tabs={[
          { id: 'account', label: 'Account Security', icon: ShieldCheck },
          { id: 'rules', label: 'Payment Terms & Rules', icon: Sliders },
          { id: 'cancellations', label: 'Cancellation Requests', icon: AlertCircle },
          { id: 'audit', label: 'Audit Trail', icon: FileText },
        ]}
        activeTab={activeSubTab}
        onChange={setActiveSubTab}
      />

      {/* Tab Panels */}
      {activeSubTab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Update Panel */}
          <MercuryCard className="space-y-4">
            <div className="border-b border-[#E1E4E8] pb-3">
              <h3 className="text-[14px] font-semibold text-[#1B1D22] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#5266EB]" strokeWidth={1.5} />
                <span>Primary Administrator Email</span>
              </h3>
              <p className="text-[12px] text-[#5F6877] mt-0.5">
                Current email:{' '}
                <strong className="text-[#1B1D22] font-mono">{user.email || 'admin@cruzaro.com'}</strong>
              </p>
            </div>

            {emailSuccess && (
              <div className="p-3 bg-[#E8F5EE] border border-[#1E7B50]/20 rounded-[8px] text-[12px] text-[#1E7B50] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{emailSuccess}</span>
              </div>
            )}

            {emailError && (
              <div className="p-3 bg-[#FBEAEA] border border-[#C02B2B]/20 rounded-[8px] text-[12px] text-[#C02B2B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{emailError}</span>
              </div>
            )}

            <form onSubmit={handleRequestEmailChange} className="space-y-3">
              <MercuryInput
                label="New Email Address"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newadmin@cruzaro.com"
              />

              <MercuryInput
                label="Confirm New Email"
                type="email"
                required
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Repeat new email"
              />

              <MercuryInput
                label="Current Password Authorization"
                type="password"
                required
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
              />

              <div className="pt-2">
                <MercuryButton variant="primary" type="submit" disabled={emailLoading}>
                  {emailLoading ? 'Dispatching Verification...' : 'Send Verification Link'}
                </MercuryButton>
              </div>
            </form>
          </MercuryCard>

          {/* Password Update Panel */}
          <MercuryCard className="space-y-4">
            <div className="border-b border-[#E1E4E8] pb-3">
              <h3 className="text-[14px] font-semibold text-[#1B1D22] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#5266EB]" strokeWidth={1.5} />
                <span>Change Password</span>
              </h3>
              <p className="text-[12px] text-[#5F6877] mt-0.5">
                Enforce strong alphanumeric passwords to protect merchant privileges
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-[#E8F5EE] border border-[#1E7B50]/20 rounded-[8px] text-[12px] text-[#1E7B50] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-[#FBEAEA] border border-[#C02B2B]/20 rounded-[8px] text-[12px] text-[#C02B2B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <MercuryInput
                label="Current Password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
              />

              <MercuryInput
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
              />

              <MercuryInput
                label="Confirm New Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />

              <div className="pt-2">
                <MercuryButton variant="primary" type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </MercuryButton>
              </div>
            </form>
          </MercuryCard>
        </div>
      )}

      {activeSubTab === 'rules' && <PaymentRulesTab />}
      {activeSubTab === 'cancellations' && <CancellationsTab />}
      {activeSubTab === 'audit' && <AuditLogTab />}
    </div>
  );
}
