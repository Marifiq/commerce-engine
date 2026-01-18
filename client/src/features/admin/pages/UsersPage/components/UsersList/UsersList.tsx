'use client';

import { UserData } from '../../hooks/useUsers';
import { Pagination, Skeleton } from '@/components/ui';
import { UserRow } from './UserRow';

interface UsersListProps {
  users: UserData[];
  loading: boolean;
  searchTerm: string;
  sortBy: string;
  currentPage: number;
  itemsPerPage: number;
  updatingId: string | number | null;
  showArchived: boolean;
  onViewProfile: (userId: string | number) => void;
  onEdit: (user: UserData) => void;
  onDelete: (userId: string | number) => void;
  onRoleChange: (userId: string | number, currentRole: string) => void;
  onPageChange: (page: number) => void;
  onMessage?: (userId: string | number) => void;
  onArchive?: (userId: number) => void;
  onUnarchive?: (userId: number) => void;
}

export function UsersList({
  users,
  loading,
  searchTerm,
  sortBy,
  currentPage,
  itemsPerPage,
  updatingId,
  showArchived,
  onViewProfile,
  onEdit,
  onDelete,
  onRoleChange,
  onPageChange,
  onMessage,
  onArchive,
  onUnarchive,
}: UsersListProps) {
  const filteredUsers = users
    .filter((u) => {
      // Archive filter - show all if showArchived is true, otherwise filter out archived
      if (!showArchived && u.isArchived) {
        return false;
      }
      if (showArchived && !u.isArchived) {
        return false;
      }
      // Search filter
      return (
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.id) - Number(a.id);
        case 'oldest':
          return Number(a.id) - Number(b.id);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'role-admin':
          return a.role === b.role ? 0 : a.role === 'admin' ? -1 : 1;
        case 'role-user':
          return a.role === b.role ? 0 : a.role === 'user' ? -1 : 1;
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  User
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hidden sm:table-cell">
                  Contact
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Role
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Skeleton variant="circular" className="h-10 w-10" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    updatingId={updatingId}
                    onViewProfile={() => onViewProfile(user.id)}
                    onEdit={() => onEdit(user)}
                    onDelete={() => onDelete(user.id)}
                    onRoleChange={() => onRoleChange(user.id, user.role)}
                    onMessage={onMessage ? () => onMessage(user.id) : undefined}
                    onArchive={onArchive ? () => onArchive(Number(user.id)) : undefined}
                    onUnarchive={onUnarchive ? () => onUnarchive(Number(user.id)) : undefined}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}

