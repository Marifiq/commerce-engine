/**
 * Hook for fetching and managing users
 */

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/utils/api';
import { useToast } from '@/contexts';

export interface UserData {
  id: number | string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export function useUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/admin/users');
      setUsers(res.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    refetch: fetchUsers,
  };
}

