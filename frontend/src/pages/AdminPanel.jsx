import UsersTable from '../components/admin/UsersTable';
import { useUsers } from '../hooks/useUsers';

/**
 * AdminPanel — orchestrates the useUsers hook and passes data + callbacks
 * down to the purely-presentational UsersTable component.
 */
export default function AdminPanel() {
  const { users, loading, error, togglingId, fetchUsers, toggleStatus } = useUsers();

  return (
    <UsersTable
      users={users}
      loading={loading}
      error={error}
      togglingId={togglingId}
      onToggle={toggleStatus}
      onRefresh={fetchUsers}
    />
  );
}
