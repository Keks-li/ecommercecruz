import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook to manage user list fetching and suspend/unsuspend toggling.
 * Hits GET /api/admin/users and PATCH /api/admin/users/:id/status
 */
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = useCallback(async (userId) => {
    setTogglingId(userId);
    try {
      const { data: updated } = await api.patch(`/admin/users/${userId}/status`);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status.');
    } finally {
      setTogglingId(null);
    }
  }, []);

  return { users, loading, error, togglingId, fetchUsers, toggleStatus };
}
