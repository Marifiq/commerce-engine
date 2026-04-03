'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import { apiFetch } from '@/lib/utils/api';
import { useToast } from '@/contexts';
import { LoadingSpinner } from '@/components/ui';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils/imageUtils';

interface User {
  id: number;
  name: string;
  email: string;
  profileImage?: string | null;
  role: string;
}

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userId: number) => Promise<void>;
  excludeUserIds?: number[];
}

export function AddParticipantModal({
  isOpen,
  onClose,
  onAdd,
  excludeUserIds = [],
}: AddParticipantModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/users');
      const adminUsers = res.data.users.filter(
        (user: User) => user.role === 'admin' && !excludeUserIds.includes(user.id)
      );
      setUsers(adminUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedUserId) {
      showToast('Please select a user', 'error');
      return;
    }

    setAdding(true);
    try {
      await onAdd(selectedUserId);
      setSelectedUserId(null);
      onClose();
    } catch (error) {
      console.error('Failed to add participant:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleAdd}
      title="Add Participant"
      message={
        <div className="w-full">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="default" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              No admin users available
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedUserId === user.id
                      ? 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-800'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user.profileImage ? (
                        <Image
                          src={resolveImageUrl(user.profileImage)}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {user.name}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      }
      confirmText={adding ? 'Adding...' : 'Add'}
      cancelText="Cancel"
      loading={adding}
    />
  );
}

