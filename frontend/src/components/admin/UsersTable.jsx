import React, { useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  Lock,
  Unlock,
  SlidersHorizontal,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import MercuryCard from './mercury/MercuryCard';
import MercuryKpiCard from './mercury/MercuryKpiCard';
import MercuryTable from './mercury/MercuryTable';
import MercuryButton from './mercury/MercuryButton';
import MercuryInput from './mercury/MercuryInput';
import MercuryBadge from './mercury/MercuryBadge';

export default function UsersTable({
  users = [],
  loading = false,
  error = null,
  togglingId = null,
  onToggle,
  onRefresh,
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const suspendedCount = users.filter((u) => u.status === 'SUSPENDED').length;
  const phoneVerifiedCount = users.filter((u) => Boolean(u.phone)).length;

  const columns = [
    {
      header: 'Customer',
      key: 'name',
      render: (row) => {
        const initials = (row.name || row.email || 'U')
          .slice(0, 2)
          .toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-[#F4F5F7] border border-[#E1E4E8] flex items-center justify-center text-[12px] font-semibold text-[#5F6877] shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-medium text-[#1B1D22]">
                {row.name || 'Unnamed Customer'}
              </div>
              <div className="text-[11px] text-[#8B93A1] flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#8B93A1]" strokeWidth={1.5} />
                <span>{row.email}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Phone (Ghana)',
      key: 'phone',
      render: (row) => (
        <span className="font-mono text-[12px] text-[#1B1D22]">
          {row.phone || <span className="text-[#8B93A1]">Unset</span>}
        </span>
      ),
    },
    {
      header: 'Member Since',
      key: 'created_at',
      render: (row) => (
        <span className="text-[#5F6877] text-[12px]">
          {row.created_at
            ? new Date(row.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      header: 'Role',
      key: 'role',
      render: (row) => (
        <MercuryBadge variant={row.role === 'ADMIN' ? 'info' : 'neutral'}>
          {row.role || 'CUSTOMER'}
        </MercuryBadge>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => {
        const isToggling = togglingId === row.id;
        const isActive = row.status === 'ACTIVE';

        return (
          <MercuryButton
            size="sm"
            variant={isActive ? 'destructive' : 'secondary'}
            icon={isActive ? Lock : Unlock}
            disabled={isToggling}
            onClick={() => onToggle && onToggle(row.id)}
          >
            {isToggling ? 'Updating...' : isActive ? 'Suspend' : 'Activate'}
          </MercuryButton>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#1B1D22] tracking-tight mercury-title">
            Customers &amp; Accounts
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Registered customer accounts, verified contact information, and access control
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MercuryButton
            variant="secondary"
            icon={RefreshCw}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </MercuryButton>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MercuryKpiCard
          label="Total Customers"
          value={users.length}
          delta="+8.4%"
          deltaType="positive"
          deltaPeriod="vs last month"
          icon={Users}
        />
        <MercuryKpiCard
          label="Active Accounts"
          value={activeCount}
          delta={activeCount > 0 ? 'Full access' : 'None'}
          deltaType="positive"
          icon={UserCheck}
        />
        <MercuryKpiCard
          label="Suspended Accounts"
          value={suspendedCount}
          delta={suspendedCount > 0 ? `${suspendedCount} blocked` : 'Clean'}
          deltaType={suspendedCount > 0 ? 'negative' : 'positive'}
          deltaPeriod="access revoked"
          icon={UserX}
        />
        <MercuryKpiCard
          label="Phone Verified"
          value={phoneVerifiedCount}
          delta={`${Math.round((phoneVerifiedCount / (users.length || 1)) * 100)}%`}
          deltaType="positive"
          deltaPeriod="SMS capable"
          icon={Phone}
        />
      </div>

      {/* Search and Filters */}
      <MercuryCard padding="sm" className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <MercuryInput
            placeholder="Search by name, phone or email..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-[#EEF0FD] text-[#5266EB]'
                : 'text-[#5F6877] hover:bg-[#F4F5F7]'
            }`}
          >
            All Accounts ({users.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
              filterStatus === 'ACTIVE'
                ? 'bg-[#EEF0FD] text-[#5266EB]'
                : 'text-[#5F6877] hover:bg-[#F4F5F7]'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('SUSPENDED')}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
              filterStatus === 'SUSPENDED'
                ? 'bg-[#EEF0FD] text-[#5266EB]'
                : 'text-[#5F6877] hover:bg-[#F4F5F7]'
            }`}
          >
            Suspended ({suspendedCount})
          </button>
        </div>
      </MercuryCard>

      {/* Users Table */}
      <MercuryTable
        columns={columns}
        data={filtered}
        keyField="id"
        isLoading={loading}
        selectedIds={selectedIds}
        onSelectRow={(id) =>
          setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
          )
        }
        onSelectAll={() =>
          setSelectedIds(
            selectedIds.length === filtered.length ? [] : filtered.map((u) => u.id)
          )
        }
        bulkActions={
          <MercuryButton size="sm" variant="secondary">
            Bulk Export Contacts
          </MercuryButton>
        }
        emptyMessage="No customer accounts found matching your query."
      />
    </div>
  );
}
