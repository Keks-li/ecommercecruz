import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminConfirmEmail() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setError('Verification token is missing. Please use the exact link sent to your email.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const { data } = await api.post('/admin/confirm-email', { token });
        setSuccess(data.message || 'Email updated successfully!');
        if (data.user?.email) {
          setNewEmail(data.user.email);
        }
        // Update stored auth credentials
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to verify email. The confirmation link may be expired or already used.'
        );
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        
        {/* Brand */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm">
            C
          </div>
          <span className="font-display text-xl font-bold text-white tracking-tight">
            Cruzaro <span className="text-indigo-400 text-xs font-normal">Security</span>
          </span>
        </div>

        {/* State Containers */}
        {loading ? (
          <div className="py-8 space-y-4">
            <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white">Verifying Confirmation Token...</h2>
            <p className="text-xs text-slate-400">Please wait while we authenticate your new email address.</p>
          </div>
        ) : success ? (
          <div className="py-4 space-y-4 animate-in fade-in">
            <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Email Address Confirmed!</h2>
              <p className="text-xs text-slate-400">
                Your administrator account email has been successfully updated to:
              </p>
              {newEmail && (
                <p className="text-sm font-mono font-bold text-indigo-400 pt-1">
                  {newEmail}
                </p>
              )}
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  window.location.href = '/admin';
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs tracking-wide transition shadow-sm active:scale-95"
              >
                Go to Admin Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4 animate-in fade-in">
            <div className="w-14 h-14 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="12" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Verification Failed</h2>
              <p className="text-xs text-rose-300 leading-relaxed max-w-xs mx-auto">
                {error}
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  window.location.href = '/admin';
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
              >
                Return to Admin Login
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
