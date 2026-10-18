import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function CustomerAuth() {
  const [isLogin, setIsLogin] = useState(true);

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & UI
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialModal, setSocialModal] = useState(null); // { provider: 'Google' | 'Apple' }
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await api.post('/auth/login', {
          identifier: loginIdentifier,
          password,
        });
      } else {
        res = await api.post('/auth/register', {
          email,
          phone: phone.trim() || undefined,
          name: name.trim() || undefined,
          password,
        });
      }

      const { data } = res;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(redirect);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Authentication failed. Please verify your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSocialModal = (provider) => {
    setError('');
    setSocialModal({ provider });
    // Pre-fill friendly suggestion
    if (!socialEmail && email) setSocialEmail(email);
    if (!socialName && name) setSocialName(name);
  };

  const handleSocialSubmit = async (e) => {
    e?.preventDefault();
    if (!socialEmail || !socialEmail.includes('@')) {
      setError('Please provide a valid email address for social sign-in.');
      return;
    }

    setSocialLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/social-login', {
        provider: socialModal.provider.toLowerCase(),
        email: socialEmail.trim(),
        name: socialName.trim() || socialEmail.split('@')[0],
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setSocialModal(null);
      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to sign in with ${socialModal.provider}.`);
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center px-4 relative overflow-hidden py-12">
      <div className="relative w-full max-w-md my-4 z-10">
        
        {/* Brand Header */}
        <div 
          onClick={() => navigate('/')} 
          className="flex flex-col items-center gap-2 mb-8 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black shadow-sm group-hover:bg-blue-600 transition-colors duration-200">
            <span className="material-symbols-outlined text-2xl">bolt</span>
          </div>
          <span className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            CRUZARO<span className="text-blue-600">.</span>
          </span>
          <p className="text-slate-500 text-xs tracking-widest uppercase font-semibold">
            Premium Electronics & Hire Purchase
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 relative">
          
          {/* Card Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-200">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                isLogin 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                !isLogin 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold font-display text-slate-900">
              {isLogin ? 'Welcome Back' : 'Create Customer Account'}
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              {isLogin 
                ? 'Sign in using your Email or Ghana Mobile Number to access your orders.'
                : 'Register to unlock flexible hire purchase plans, Paystack checkout, and tracking.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 text-xs leading-relaxed">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Social Sign-In Buttons */}
          <div className="space-y-2.5 mb-6">
            <button
              type="button"
              onClick={() => handleOpenSocialModal('Google')}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs hover:border-slate-400 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {/* Google 4-Color SVG Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLogin ? 'Sign in with Google' : 'Continue with Google'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSocialModal('Apple')}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
            >
              {/* Apple SVG Icon */}
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.73-7.87-12.09-14.37-6.08-9.08-10.9-19.16-14.47-30.24-3.57-11.09-5.36-21.72-5.36-31.91 0-14.28 3.55-25.99 10.66-35.13 7.11-9.14 16.14-13.79 27.09-13.95 5.24 0 10.74 1.34 16.48 4.01 5.74 2.68 9.53 4.09 11.39 4.24 1.48-.15 5.48-1.63 12.01-4.44 6.53-2.82 12.19-4.08 16.98-3.79 12.38.64 22.38 5.16 30 13.56-10.74 6.53-16.03 15.42-15.86 26.68.17 8.87 3.51 16.32 10.02 22.35 6.51 6.03 14.18 9.39 23.01 10.08-2.31 7.23-5.26 14.71-8.86 22.45zM119.22 31.84c0-7.07 2.54-13.68 7.62-19.82 5.08-6.14 11.27-9.87 18.57-11.19.17 1.15.26 2.18.26 3.1 0 6.94-2.6 13.65-7.79 20.13-5.2 6.48-11.46 10.15-18.79 11.01-.17-1.15-.26-2.18-.26-3.23z"/>
              </svg>
              <span>{isLogin ? 'Sign in with Apple' : 'Continue with Apple'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider text-[10px]">
                Or {isLogin ? 'sign in' : 'register'} with credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              /* Login Identifier (Email or Phone) */
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                    contact_mail
                  </span>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="name@example.com or 0244123456"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition duration-200"
                  />
                </div>
              </div>
            ) : (
              /* Registration Fields */
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Full Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                      person
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Kofi Mensah"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Ghana Mobile Number <span className="text-slate-400 font-normal lowercase">(for MoMo & updates)</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                      smartphone
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0244123456 or +233244123456"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition duration-200"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                    lock_clock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition duration-200"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-slate-900 hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In to Account' : 'Complete Registration'}</span>
              )}
            </button>
          </form>
        </div>

        {/* Back to Store */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-slate-500 hover:text-blue-600 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Store Catalog
          </Link>
        </div>
      </div>

      {/* Social Sign-In Modal */}
      {socialModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSocialModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                {socialModal.provider === 'Google' ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 fill-slate-900" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.73-7.87-12.09-14.37-6.08-9.08-10.9-19.16-14.47-30.24-3.57-11.09-5.36-21.72-5.36-31.91 0-14.28 3.55-25.99 10.66-35.13 7.11-9.14 16.14-13.79 27.09-13.95 5.24 0 10.74 1.34 16.48 4.01 5.74 2.68 9.53 4.09 11.39 4.24 1.48-.15 5.48-1.63 12.01-4.44 6.53-2.82 12.19-4.08 16.98-3.79 12.38.64 22.38 5.16 30 13.56-10.74 6.53-16.03 15.42-15.86 26.68.17 8.87 3.51 16.32 10.02 22.35 6.51 6.03 14.18 9.39 23.01 10.08-2.31 7.23-5.26 14.71-8.86 22.45zM119.22 31.84c0-7.07 2.54-13.68 7.62-19.82 5.08-6.14 11.27-9.87 18.57-11.19.17 1.15.26 2.18.26 3.1 0 6.94-2.6 13.65-7.79 20.13-5.2 6.48-11.46 10.15-18.79 11.01-.17-1.15-.26-2.18-.26-3.23z"/>
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Continue with {socialModal.provider}
                </h3>
                <p className="text-slate-500 text-[11px]">Instant sign-in & registration</p>
              </div>
            </div>

            <form onSubmit={handleSocialSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {socialModal.provider} Account Email
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={socialEmail}
                  onChange={(e) => setSocialEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={socialName}
                  onChange={(e) => setSocialName(e.target.value)}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSocialModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={socialLoading || !socialEmail}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {socialLoading ? 'Authenticating...' : 'Confirm Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
