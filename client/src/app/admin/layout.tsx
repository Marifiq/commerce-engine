'use client';

import { lazy, Suspense } from 'react';
import { AdminGuard } from '@/components/common';
import { ToastProvider } from '@/contexts';
import { LoadingSpinner } from '@/components/ui';

// Lazy load AdminSidebar for better performance
const AdminSidebar = lazy(() => 
  import('@/components/admin').then(module => ({ default: module.AdminSidebar }))
);

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminGuard>
            <ToastProvider>
                <div className="min-h-screen bg-[#fafafa] dark:bg-black text-zinc-900 dark:text-zinc-100">
                    <Suspense fallback={
                        <div className="fixed left-0 top-0 h-screen w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                            <LoadingSpinner size="default" />
                        </div>
                    }>
                        <AdminSidebar />
                    </Suspense>
                    <main className="lg:pl-72 pt-16 lg:pt-0">
                        <div className="p-4 sm:p-6 lg:p-10">
                            {children}
                        </div>
                    </main>
                </div>
            </ToastProvider>
        </AdminGuard>
    );
}
