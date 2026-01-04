import { Metadata } from 'next';
import { ordersMetadata } from '@/features/orders/pages/OrdersPage/metadata';

export const metadata: Metadata = ordersMetadata;

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

