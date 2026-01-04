'use client';

interface SortFilterProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  disabled?: boolean;
  variant?: 'desktop' | 'mobile';
}

export function SortFilter({
  sortBy,
  onSortChange,
  disabled = false,
  variant = 'desktop',
}: SortFilterProps) {
  if (variant === 'mobile') {
    return (
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
          Sort By
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'newest', label: 'Newest First' },
            { id: 'price-low', label: 'Price: Low to High' },
            { id: 'price-high', label: 'Price: High to Low' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => onSortChange(option.id)}
              disabled={disabled}
              className={`text-left px-6 py-4 rounded-2xl font-bold transition-all ${
                sortBy === option.id
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white'
                  : 'text-zinc-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        Sort By
      </h3>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="newest">Newest First</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
      </select>
    </div>
  );
}

