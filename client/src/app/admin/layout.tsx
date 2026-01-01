import AdminSidebar from '../components/AdminSidebar';
import AdminGuard from '../components/AdminGuard';

import { ToastProvider } from '@/app/components/ToastContext';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminGuard>
            <ToastProvider>
                <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
                    <AdminSidebar />
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
