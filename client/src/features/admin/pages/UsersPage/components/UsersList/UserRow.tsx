'use client';

import { Mail, Shield, User } from 'lucide-react';
import { UserData } from '../../hooks/useUsers';
import { UserActions } from '../UserActions';

interface UserRowProps {
  user: UserData;
  updatingId: string | number | null;
  onViewProfile: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRoleChange: () => void;
  onMessage?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
}

export function UserRow({
  user,
  updatingId,
  onViewProfile,
  onEdit,
  onDelete,
  onRoleChange,
  onMessage,
  onArchive,
  onUnarchive,
}: UserRowProps) {
  return (
    <tr
      onClick={onViewProfile}
      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
            {user.name.charAt(0)}
          </div>
          <div className="flex items-center gap-2">
            <div className="font-bold text-zinc-900 dark:text-white">{user.name}</div>
            {user.isArchived && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                Archived
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 hidden sm:table-cell">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
          <Mail size={14} />
          {user.email}
        </div>
      </td>
      <td className="px-6 py-4">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
            user.role === 'admin'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
          {user.role.toUpperCase()}
        </div>
      </td>
      <td className="px-6 py-4 text-right min-w-[280px]">
        <UserActions
          user={user}
          updatingId={updatingId}
          onEdit={onEdit}
          onDelete={onDelete}
          onRoleChange={onRoleChange}
          onMessage={onMessage}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
        />
      </td>
    </tr>
  );
}

