'use client';

import { Edit2, Trash2, Shield, ShieldAlert, MessageSquare, Archive, ArchiveRestore } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { UserData } from '../../hooks/useUsers';

interface UserActionsProps {
  user: UserData;
  updatingId: string | number | null;
  onEdit: () => void;
  onDelete: () => void;
  onRoleChange: () => void;
  onMessage?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
}

export function UserActions({
  user,
  updatingId,
  onEdit,
  onDelete,
  onRoleChange,
  onMessage,
  onArchive,
  onUnarchive,
}: UserActionsProps) {
  const isUpdating = updatingId === user.id;

  return (
    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
      {onMessage && (
        <button
          onClick={onMessage}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10"
          title="Message User"
        >
          <MessageSquare size={14} />
        </button>
      )}
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
        title="Edit User"
      >
        <Edit2 size={14} />
      </button>
      {user.isArchived ? (
        onUnarchive && (
          <button
            onClick={onUnarchive}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-zinc-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10"
            title="Unarchive"
          >
            <ArchiveRestore size={14} />
          </button>
        )
      ) : (
        onArchive && (
          <button
            onClick={onArchive}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10"
            title="Archive"
          >
            <Archive size={14} />
          </button>
        )
      )}
      <button
        onClick={onDelete}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
        title="Delete User"
      >
        <Trash2 size={14} />
      </button>
      <button
        onClick={onRoleChange}
        disabled={isUpdating}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
          user.role === 'admin'
            ? 'text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-lg shadow-black/5'
        } disabled:opacity-50`}
      >
        {isUpdating ? (
          <LoadingSpinner size="small" />
        ) : user.role === 'admin' ? (
          <ShieldAlert size={14} />
        ) : (
          <Shield size={14} />
        )}
        <span className="hidden lg:inline">
          {user.role === 'admin' ? 'Revoke' : 'Make Admin'}
        </span>
      </button>
    </div>
  );
}

