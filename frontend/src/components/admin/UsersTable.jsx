import { useState } from 'react';
import StatusBadge from './StatusBadge';

// ─── Icons (inline SVG, no extra deps) ───────────────────────────────────────
function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function RefreshIcon({ spinning }) {
  return (
    <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function UnlockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ─── Skeleton loader row ──────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-t border-slate-700/50">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-slate-700/60 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────
/**
 * UsersTable — displays all customers with live Suspend/Unsuspend toggles.
 *
 * @param {object[]} users       - Array of user objects from the API
 * @param {boolean}  loading     - True while initial fetch is in progress
 * @param {string|null} error    - Error message string or null
 * @param {number|null} togglingId - ID of the user currently being toggled
 * @param {function} onToggle    - (userId) => void  — called on button click
 * @param {function} onRefresh   - () => void        — called on refresh click
 */
export default function UsersTable({ users, loading, error, togglingId, onToggle, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q);
    const matchesStatus =
      filterStatus === 'ALL' ||
      u.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const suspendedCount = users.filter((u) => u.status === 'SUSPENDED').length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 p-6 md:p-10 font-sans">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-indigo-500/15 rounded-lg text-indigo-400">
            <UsersIcon />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
        </div>
        <p className="text-slate-400 text-sm ml-11">Manage customer accounts, contact numbers, authentication methods, and access levels.</p>
      </div>

      {/* ── Stat chips ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <StatChip label="Total Users" value={users.length} color="indigo" />
        <StatChip label="Active" value={activeCount} color="emerald" />
        <StatChip label="Suspended" value={suspendedCount} color="rose" />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon />
          </span>
          <input
            id="user-search"
            type="text"
            placeholder="Search by name, email, or Ghana mobile number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/70 border border-slate-700 text-slate-200 placeholder-slate-500
              rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60
              focus:border-indigo-500 transition"
          />
        </div>

        {/* Status filter */}
        <select
          id="status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800/70 border border-slate-700 text-slate-300 rounded-xl px-4 py-2.5
            text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        {/* Refresh */}
        <button
          id="refresh-btn"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700
            text-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshIcon spinning={loading} />
          Refresh
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mb-4 flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm">
          <span className="text-rose-400 mt-0.5">⚠</span>
          <p>{error}</p>
        </div>
      )}

      {/* ── Table card ── */}
      <div className="rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl shadow-black/40 bg-slate-900/60 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 uppercase text-xs tracking-widest">
                <th className="px-6 py-4 text-left font-semibold">#</th>
                <th className="px-6 py-4 text-left font-semibold">Customer</th>
                <th className="px-6 py-4 text-left font-semibold">Ghana Mobile</th>
                <th className="px-6 py-4 text-left font-semibold">Sign-In Provider</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🔍</span>
                      <span>No users found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user, index) => (
                  <UserRow
                    key={user.id}
                    index={index + 1}
                    user={user}
                    isToggling={togglingId === user.id}
                    onToggle={() => onToggle(user.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/40 text-xs text-slate-500">
            Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of{' '}
            <span className="text-slate-300 font-medium">{users.length}</span> users
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatChip({ label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/25 text-rose-400',
  };
  return (
    <div className={`flex items-center gap-2 border rounded-xl px-4 py-2 text-sm ${colors[color]}`}>
      <span className="font-bold text-lg leading-none">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}

function UserRow({ index, user, isToggling, onToggle }) {
  const isSuspended = user.status === 'SUSPENDED';
  const provider = user.auth_provider?.toUpperCase() || 'LOCAL';

  return (
    <tr
      className={`border-t border-slate-700/40 transition-colors duration-150
        ${isSuspended ? 'bg-rose-950/10' : 'hover:bg-slate-800/40'}`}
    >
      {/* # */}
      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{String(index).padStart(2, '0')}</td>

      {/* Customer Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || user.email}
              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center
              text-indigo-300 font-semibold text-xs uppercase flex-shrink-0">
              {(user.name?.[0] || user.email[0]).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            {user.name && (
              <span className="text-slate-100 font-semibold text-xs block truncate max-w-[200px]">
                {user.name}
              </span>
            )}
            <span className="text-slate-400 text-xs truncate max-w-[200px] block font-mono">
              {user.email}
            </span>
          </div>
        </div>
      </td>

      {/* Ghana Mobile Phone */}
      <td className="px-6 py-4 whitespace-nowrap">
        {user.phone ? (
          <a
            href={`tel:${user.phone}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs hover:bg-emerald-500/20 transition-colors"
            title="Call / WhatsApp customer"
          >
            <span>🇬🇭</span>
            <span>{user.phone}</span>
          </a>
        ) : (
          <span className="text-slate-500 text-xs italic">Not registered</span>
        )}
      </td>

      {/* Sign-in Provider */}
      <td className="px-6 py-4 whitespace-nowrap">
        {provider === 'GOOGLE' ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google
          </span>
        ) : provider === 'APPLE' ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-700/60 border border-slate-600 text-slate-200 text-[11px] font-medium">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 .6-2.65 1.35-.56.64-1.06 1.69-.93 2.71 1.01.08 2.02-.46 2.65-1.21z" />
            </svg>
            Apple
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] font-mono">
            <span>✉️</span>
            Email
          </span>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge status={user.status} />
      </td>

      {/* Action */}
      <td className="px-6 py-4 text-right">
        <button
          id={`toggle-${user.id}`}
          onClick={onToggle}
          disabled={isToggling}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold
            transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
            ${isSuspended
              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 ring-1 ring-emerald-500/30 hover:ring-emerald-500/50'
              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 ring-1 ring-rose-500/30 hover:ring-rose-500/50'
            }`}
        >
          {isToggling ? (
            <SpinnerIcon />
          ) : isSuspended ? (
            <UnlockIcon />
          ) : (
            <LockIcon />
          )}
          {isToggling ? 'Updating…' : isSuspended ? 'Unsuspend' : 'Suspend'}
        </button>
      </td>
    </tr>
  );
}
