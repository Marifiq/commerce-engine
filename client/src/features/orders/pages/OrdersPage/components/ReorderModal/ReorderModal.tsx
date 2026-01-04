'use client';

import Link from 'next/link';
import { Modal } from '@/components/ui';
import { ReorderResult } from '../../hooks/useOrderActions';

interface ReorderModalProps {
  isOpen: boolean;
  result: ReorderResult | null;
  onClose: () => void;
}

export function ReorderModal({ isOpen, result, onClose }: ReorderModalProps) {
  if (!result) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onClose}
      title="Reorder Status"
      message={
        <div className="text-left w-full">
          <p className="mb-4 text-sm leading-relaxed">{result.message}</p>
          {result.unavailableItems && result.unavailableItems.length > 0 && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                Out of Stock Items:
              </p>
              <div className="space-y-3">
                {result.unavailableItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 p-2 bg-white dark:bg-zinc-900 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {item.available === 0
                          ? `Out of stock (requested: ${item.requested})`
                          : `Only ${item.available} available (requested: ${item.requested})`}
                      </p>
                    </div>
                    <Link
                      href={`/shop?category=${encodeURIComponent(item.category)}`}
                      onClick={onClose}
                      className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
                    >
                      Shop {item.category}
                    </Link>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 italic">
                Click on &quot;Shop [Category]&quot; to browse similar products in that category.
              </p>
            </div>
          )}
        </div>
      }
      confirmText="OK"
      cancelText=""
      type="info"
    />
  );
}

