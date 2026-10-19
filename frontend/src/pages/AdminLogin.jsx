import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import MercuryCard from '../components/admin/mercury/MercuryCard';
import MercuryButton from '../components/admin/mercury/MercuryButton';
import MercuryInput from '../components/admin/mercury/MercuryInput';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });

      if (data.user.role !== 'ADMIN') {
        setError('Access denied. Administrator privileges required.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[8px] bg-[#5266EB] text-white font-bold text-base mb-3 select-none">
            C
          </div>
          <h1 className="text-[20px] font-semibold text-[#1B1D22] tracking-tight mercury-title">
            Cruzaro Admin
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-1">
            Sign in to access merchant dashboard &amp; store operations
          </p>
        </div>

        {/* Flat Mercury Panel */}
        <MercuryCard className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 bg-[#FBEAEA] border border-[#C02B2B]/20 rounded-[8px] text-[12px] text-[#C02B2B] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <MercuryInput
              label="Admin Email"
              id="admin-email"
              type="email"
              required
              autoFocus
              icon={Mail}
              placeholder="admin@cruzaro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <MercuryInput
              label="Password"
              id="admin-password"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <MercuryButton
                type="submit"
                variant="primary"
                className="w-full h-10"
                disabled={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              </MercuryButton>
            </div>
          </form>
        </MercuryCard>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-[#8B93A1]">
          <span>Protected by session authorization and strict token security</span>
        </div>
      </div>
    </div>
  );
}
