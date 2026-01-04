import { Metadata } from 'next';
import { adminOffersMetadata } from '@/features/admin/pages/OffersPage/metadata';

export const metadata: Metadata = adminOffersMetadata;

export default function AdminOffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

