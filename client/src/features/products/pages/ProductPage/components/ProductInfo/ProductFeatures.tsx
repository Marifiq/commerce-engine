'use client';

import { Star } from 'lucide-react';
import { Product } from '@/types/product';

interface ProductFeaturesProps {
  product: Product;
}

export function ProductFeatures({ product }: ProductFeaturesProps) {
  return (
    <div className="mt-8 flex items-center space-x-2">
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${(product.averageRating || 0) > i
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-zinc-300 dark:text-zinc-700'
            } h-4 w-4 shrink-0`}
          />
        ))}
      </div>
      <span className="text-sm text-zinc-500">
        ({product.reviewCount || 0} reviews)
      </span>
    </div>
  );
}

