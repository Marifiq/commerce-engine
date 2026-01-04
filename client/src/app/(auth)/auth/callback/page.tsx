'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useRedux';
import { googleAuth } from '@/store/features/auth/authThunks';
import { mergeGuestCart } from '@/store/features/cart';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            // Redirect to login with error
            router.push(`/login?error=${encodeURIComponent(error)}`);
            return;
        }

        if (!token) {
            // No token provided, redirect to login
            router.push('/login?error=no_token');
            return;
        }

        // Dispatch Google auth thunk with token
        const handleAuth = async () => {
            try {
                const resultAction = await dispatch(googleAuth(token));
                
                if (googleAuth.fulfilled.match(resultAction)) {
                    // Merge guest cart if any
                    await dispatch(mergeGuestCart());
                    // Redirect to home page
                    router.push('/');
                } else {
                    // Auth failed, redirect to login with error
                    router.push('/login?error=authentication_failed');
                }
            } catch (err) {
                // Error occurred, redirect to login
                router.push('/login?error=authentication_failed');
            }
        };

        handleAuth();
    }, [searchParams, dispatch, router]);

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-black">
            <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-xl shadow-lg border border-zinc-800">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        Completing sign in...
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Please wait while we sign you in
                    </p>
                    <div className="mt-6 flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

