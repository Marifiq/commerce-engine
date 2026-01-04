'use client';

import { Search, ArrowUpDown } from 'lucide-react';
import { Category } from '@/types/category';

type SortOption = 'name-asc' | 'name-desc' | 'category-asc' | 'category-desc' | 'none';

interface ProductSearchProps {
  searchTerm: string;
  selectedCategory: string;
  sortOption: SortOption;
  categories: Category[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
}

export function ProductSearch({
  searchTerm,
  selectedCategory,
  sortOption,
  categories,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: ProductSearchProps) {
  return (
    <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-widest">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-widest">
            Sort
          </label>
          <div className="relative">
            <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" size={12} />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              onClick={(e) => e.stopPropagation()}
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="none">No Sort</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="category-asc">Category (A-Z)</option>
              <option value="category-desc">Category (Z-A)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

