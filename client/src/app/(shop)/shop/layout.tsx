import { Metadata } from 'next';
import { shopMetadata } from '@/features/products/pages/ShopPage/metadata';

export const metadata: Metadata = shopMetadata;

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

