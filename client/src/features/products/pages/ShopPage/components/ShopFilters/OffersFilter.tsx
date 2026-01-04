'use client';

import { Tag } from 'lucide-react';

interface OffersFilterProps {
  showOffOnly: boolean;
  onToggle: (value: boolean) => void;
  variant?: 'desktop' | 'mobile';
}

export function OffersFilter({
  showOffOnly,
  onToggle,
  variant = 'desktop',
}: OffersFilterProps) {
  if (variant === 'mobile') {
    return (
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
          Offers
        </h3>
        <label className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl cursor-pointer">
          <span className="text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
            Show Only Discounted
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={showOffOnly}
              onChange={(e) => onToggle(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-12 h-6 rounded-full transition-all duration-200 ${
                showOffOnly
                  ? 'bg-black dark:bg-white'
                  : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white dark:bg-black rounded-full transition-transform duration-200 transform ${
                  showOffOnly ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5 shadow-md`}
              />
            </div>
          </div>
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center gap-2">
        <Tag size={14} /> Offers
      </h3>
      <label className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
        <span className="text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
          Show Only Discounted
        </span>
        <div className="relative">
          <input
            type="checkbox"
            checked={showOffOnly}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-12 h-6 rounded-full transition-all duration-200 ${
              showOffOnly
                ? 'bg-black dark:bg-white'
                : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white dark:bg-black rounded-full transition-transform duration-200 transform ${
                showOffOnly ? 'translate-x-6' : 'translate-x-0.5'
              } mt-0.5 shadow-md`}
            />
          </div>
        </div>
      </label>
    </div>
  );
}

