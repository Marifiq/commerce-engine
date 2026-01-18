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
  isArchived?: boolean;
}

export function useUsers(includeArchived: boolean = false) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (includeArchived) {
        params.append('includeArchived', 'true');
      }
      const url = `/admin/users${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await apiFetch(url);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived]);

  return {
    users,
    loading,
    refetch: fetchUsers,
  };
}

