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
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase());
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
        <p className="text-slate-400 text-sm ml-11">Manage customer accounts and access levels.</p>
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
            placeholder="Search by email…"
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
                <th className="px-6 py-4 text-left font-semibold">Email</th>
                <th className="px-6 py-4 text-left font-semibold">Role</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-500">
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

  return (
    <tr
      className={`border-t border-slate-700/40 transition-colors duration-150
        ${isSuspended ? 'bg-rose-950/10' : 'hover:bg-slate-800/40'}`}
    >
      {/* # */}
      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{String(index).padStart(2, '0')}</td>

      {/* Email */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center
            text-indigo-300 font-semibold text-xs uppercase flex-shrink-0">
            {user.email[0]}
          </div>
          <span className="text-slate-200 font-medium truncate max-w-[220px]">{user.email}</span>
        </div>
      </td>

      {/* Role */}
      <td className="px-6 py-4">
        <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-700/60 text-slate-400 text-xs font-mono uppercase tracking-wider">
          {user.role}
        </span>
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
