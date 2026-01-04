'use client';

import { Product } from '@/types/product';
import { ProductPrice } from './ProductPrice';
import { ProductFeatures } from './ProductFeatures';

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  return (
    <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 uppercase tracking-widest">
            {product.category}
          </p>
        </div>
        <ProductPrice product={product} />
      </div>

      <div className="mt-6">
        <h3 className="sr-only">Description</h3>
        <div className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {product.description ||
            'Crafted from premium heavyweight cotton, this essential piece features a relaxed silhouette and reinforced stitching for lasting durability. A versatile addition to any wardrobe, designed for comfort and style.'}
        </div>
      </div>

      <ProductFeatures product={product} />
    </div>
  );
}

