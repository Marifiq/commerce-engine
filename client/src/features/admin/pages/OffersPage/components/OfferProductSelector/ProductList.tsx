'use client';

import { Product } from '@/types/product';
import { resolveImageUrl } from '@/lib/utils/imageUtils';

interface ProductListProps {
  products: Product[];
  selectedProductIds: number[];
  onToggle: (productId: number) => void;
}

export function ProductList({ products, selectedProductIds, onToggle }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-zinc-500">No products found</div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-64">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => onToggle(product.id)}
          className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
            selectedProductIds.includes(product.id)
              ? 'bg-zinc-100 dark:bg-zinc-800'
              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
            <img
              src={resolveImageUrl(product.image)}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-zinc-900 dark:text-white truncate text-sm">
              {product.name}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {product.category || 'N/A'}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
              ${product.price.toFixed(2)} • Stock: {product.stock || 0}
            </div>
          </div>
          {selectedProductIds.includes(product.id) && (
            <div className="h-2 w-2 rounded-full bg-black dark:bg-white shrink-0"></div>
          )}
        </div>
      ))}
    </div>
  );
}

