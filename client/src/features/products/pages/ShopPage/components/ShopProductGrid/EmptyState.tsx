'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  section: string;
  onClearFilters?: () => void;
}

export function EmptyState({ section, onClearFilters }: EmptyStateProps) {
  if (section === 'off') {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
        <div className="p-6 bg-white dark:bg-black rounded-3xl shadow-xl mb-6">
          <Search size={48} className="text-zinc-200" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
          No Offers Available
        </h3>
        <p className="text-zinc-500 font-medium">
          Check back soon for exciting discounts and special offers!
        </p>
        <Link
          href="/shop"
          className="mt-8 px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-32 bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
      <div className="p-6 bg-white dark:bg-black rounded-3xl shadow-xl mb-6">
        <Search size={48} className="text-zinc-200" />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
        No products found
      </h3>
      <p className="text-zinc-500 font-medium">
        Try adjusting your filters or search terms
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="mt-8 px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}

