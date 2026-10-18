import { useState } from 'react';
import api from '../../services/api';

export default function AdminSettingsTab() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

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
      setEmailError('The confirmation email does not match the new email address.');
      return;
    }

    if (!emailCurrentPassword) {
      setEmailError('Please enter your current password to authorize this change.');
      return;
    }

    setEmailLoading(true);
    try {
      const { data } = await api.post('/admin/change-email', {
        newEmail: newEmail.trim().toLowerCase(),
        currentPassword: emailCurrentPassword,
      });

      setEmailSuccess(
        data.message ||
        `Confirmation link has been sent to ${newEmail}. Please click the link to verify and activate your new email.`
      );
      if (data.confirmationUrl) {
        setPreviewLink(data.confirmationUrl);
      }
      setNewEmail('');
      setConfirmEmail('');
      setEmailCurrentPassword('');
    } catch (err) {
      setEmailError(
        err.response?.data?.error || 'Failed to dispatch email confirmation. Please verify your current password.'
      );
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

      setPasswordSuccess(data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      setPasswordError(
        err.response?.data?.error || 'Failed to change password. Please verify your current password.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Account Security</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Manage your administrator email and login password. Email updates require link confirmation.
        </p>
      </div>

      {/* Account Info Pill */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-lg">
            {(user.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{user.email || 'admin@cruzaro.com'}</span>
              <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Active Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Primary Root Administrator ID: #{user.id || 1}</p>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Role: <strong className="text-slate-200 font-mono">ADMIN</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* ── Card 1: Change Email ── */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Update Admin Email</h2>
                <p className="text-xs text-slate-500">Requires email confirmation link verification</p>
              </div>
            </div>

            {/* Email Success Banner */}
            {emailSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 text-xs space-y-2 leading-relaxed">
                <div className="flex items-center gap-2 font-bold">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Verification Link Sent!</span>
                </div>
                <p>{emailSuccess}</p>
                {previewLink && (
                  <div className="pt-1">
                    <a
                      href={previewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono break-all inline-block"
                    >
                      Click here to test confirmation immediately
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Email Error Banner */}
            {emailError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl p-3.5 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{emailError}</span>
              </div>
            )}

            <form onSubmit={handleRequestEmailChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  New Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="newadmin@cruzaro.com"
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Confirm New Email Address
                </label>
                <input
                  type="email"
                  required
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Repeat new email address"
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Current Admin Password (Security Verification)
                </label>
                <input
                  type="password"
                  required
                  value={emailCurrentPassword}
                  onChange={(e) => setEmailCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow-sm flex items-center justify-center gap-2"
                >
                  {emailLoading ? (
                    <span>Dispatching Confirmation Link...</span>
                  ) : (
                    <span>Send Confirmation Email Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Card 2: Change Password ── */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Change Admin Password</h2>
                <p className="text-xs text-slate-500">Update your master administrator credentials</p>
              </div>
            </div>

            {/* Password Success Banner */}
            {passwordSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-3.5 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Password Error Banner */}
            {passwordError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl p-3.5 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow-sm flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <span>Updating Password...</span>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
