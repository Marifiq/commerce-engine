'use client';

import { Edit2, Trash2 } from 'lucide-react';

interface OfferActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function OfferActions({ onEdit, onDelete }: OfferActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onEdit}
        className="p-2 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
      >
        <Edit2 size={18} />
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors cursor-pointer"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

