'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/hooks/useRedux';
import { LoadingSpinner } from '@/components/ui';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated } = useAppSelector((state) => state.user);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage directly for immediate feedback to avoid flicker
        // or rely on Redux state if it's already rehydrated by AuthInitializer
        const storedUser = localStorage.getItem('currentUser');

        if (!isAuthenticated && !storedUser) {
            router.push('/login');
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated, router]);

    if (isLoading) {
        // You can replace this with a proper loading spinner
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return <>{children}</>;
}
