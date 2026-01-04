'use client';

import Link from 'next/link';
import { Search, SlidersHorizontal, ChevronRight } from 'lucide-react';

interface ShopHeaderProps {
  section: string;
  activeCategory: string;
  showOffOnly: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterToggle: () => void;
  isFilterOpen: boolean;
}

export function ShopHeader({
  section,
  activeCategory,
  showOffOnly,
  searchTerm,
  onSearchChange,
  onFilterToggle,
  isFilterOpen,
}: ShopHeaderProps) {
  const getTitle = () => {
    if (section === 'new-arrivals') return 'New Arrivals';
    if (section === 'best-sellers') return 'Best Sellers';
    if (section === 'off') return 'Off';
    if (showOffOnly) {
      return activeCategory ? `${activeCategory} - On Sale` : 'On Sale';
    }
    return activeCategory || 'All Products';
  };

  const getDescription = () => {
    if (section === 'new-arrivals') return 'Fresh drops from our latest collection';
    if (section === 'best-sellers') return 'Our most popular designs, meticulously crafted and loved by our community worldwide';
    if (section === 'off') return 'Special discounts on selected items - Limited time offers';
    if (showOffOnly) return 'Special discounts on selected items - Limited time offers';
    return 'Discover our premium collection of high-quality apparel and accessories.';
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
          <Link
            href="/"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            Home
          </Link>
          <ChevronRight size={12} />
          <span className="text-black dark:text-white">Shop</span>
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tighter text-black dark:text-white">
          {getTitle()}
        </h1>
        <p className="text-zinc-500 font-medium max-w-lg">
          {getDescription()}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group flex-1 md:w-64">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-bold"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button
          onClick={onFilterToggle}
          className={`p-3 rounded-2xl border transition-all md:hidden ${
            isFilterOpen
              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}

