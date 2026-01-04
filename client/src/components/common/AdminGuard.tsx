'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/hooks/useRedux';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { currentUser, isAuthenticated, loading } = useAppSelector((state) => state.user);
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated || !currentUser || currentUser.role !== 'admin') {
                router.push('/'); // Redirect non-admins to home
            } else {
                setIsAuthorized(true);
            }
        }
    }, [currentUser, isAuthenticated, loading, router]);

    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return <>{children}</>;
}

