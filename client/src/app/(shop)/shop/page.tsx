import { categoryServiceServer } from '@/services/categoryService.server';
import { productServiceServer } from '@/services/productService.server';
import { ShopPageClient } from './ShopPageClient';

interface ShopPageProps {
  searchParams: Promise<{ section?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { section } = await searchParams;
  
  // Fetch initial data on the server for better performance
  const [categories, initialProducts] = await Promise.all([
    categoryServiceServer.getAllCategories(),
    // Optionally fetch initial products if no filters are applied
    section ? productServiceServer.getAllProducts(`?section=${section}`) : Promise.resolve(undefined),
  ]);

  return (
    <ShopPageClient 
      initialCategories={categories} 
      initialProducts={initialProducts}
      section={section}
    />
  );
}
