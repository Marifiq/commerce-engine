import { Metadata } from 'next';
import { adminUsersMetadata } from '@/features/admin/pages/UsersPage/metadata';

export const metadata: Metadata = adminUsersMetadata;

export default function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

