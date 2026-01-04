import { Metadata } from 'next';
import { adminProductsMetadata } from '@/features/admin/pages/ProductsPage/metadata';

export const metadata: Metadata = adminProductsMetadata;

export default function AdminProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

