'use client';

import { Category } from '@/types/category';

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategorySelect: (category: string) => void;
  variant?: 'desktop' | 'mobile';
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategorySelect,
  variant = 'desktop',
}: CategoryFilterProps) {
  if (variant === 'mobile') {
    return (
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
          Categories
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategorySelect('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${
              activeCategory === ''
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                activeCategory === cat.name
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center gap-2">
        <span>Categories</span>
      </h3>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onCategorySelect('')}
          className={`text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer ${
            activeCategory === ''
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10'
              : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'
          }`}
        >
          All Products
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategorySelect(cat.name)}
            className={`text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer ${
              activeCategory === cat.name
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}

