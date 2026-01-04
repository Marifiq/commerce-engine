'use client';

import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { login, clearError } from '@/store/features/auth';
import { mergeGuestCart, toggleCheckout } from '@/store/features/cart';
import { authService } from '@/services/auth.service';


export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.user);
    const [showPassword, setShowPassword] = useState(false);
    const [queryError, setQueryError] = useState<string | null>(null);
    const redirectParam = searchParams.get('redirect');
    const showCheckoutMessage = redirectParam === 'checkout';

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setQueryError(decodeURIComponent(errorParam));
            // Clear error from URL
            router.replace('/login', { scroll: false });
        }
    }, [searchParams, router]);

    const validationSchema = Yup.object({
        email: Yup.string().email('Invalid email address').required('Email is required'),
        password: Yup.string().required('Password is required'),
    });

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            dispatch(clearError());
            const trimmedValues = {
                email: values.email.trim(),
                password: values.password // Don't trim password usually, but for this specific issue let's check. Actually, passwords *can* have spaces, but usually not at start/end for simple apps. Let's just trim email.
            };
            // Actually, if the user copy-pasted 'adminPassword ', they might want it trimmed if it was accidental.
            // But strict password handling says don't trim. However, for debugging this specific "I can't login" case...
            // Let's stick to trimming EMAIL only for now.

            // Wait, checking the user's password 'adminPassword'. No spaces.

            const resultAction = await dispatch(login({ ...values, email: values.email.trim() }));

            if (login.fulfilled.match(resultAction)) {
                await dispatch(mergeGuestCart());
                
                // Check if redirect is for checkout
                if (redirectParam === 'checkout') {
                    // Open checkout modal and navigate to home with redirect param
                    dispatch(toggleCheckout());
                    router.push('/?redirect=checkout');
                } else {
                    router.push('/');
                }
            }
        },
    });


    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-black">
            <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-xl shadow-lg border border-zinc-800">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Please sign in to your account
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                        (Try: user@example.com / password123)
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    {showCheckoutMessage && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm p-3 rounded-md text-center border border-blue-200 dark:border-blue-800">
                            Sign in to proceed confirm order
                        </div>
                    )}
                    {(error || queryError) && (
                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md text-center border border-red-200">
                            {queryError || error}
                        </div>
                    )}

                    {/* Google Sign In Button */}
                    <button
                        type="button"
                        onClick={() => authService.googleAuth()}
                        disabled={loading}
                        className={`flex w-full items-center justify-center gap-3 rounded-md border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span>Sign in with Google</span>
                    </button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-zinc-900 text-zinc-400">OR</span>
                        </div>
                    </div>

                <form className="space-y-6" onSubmit={formik.handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                                Email address
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Mail className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="email"
                                    className={`block w-full rounded-md border py-2 pl-10 pr-3 sm:text-sm focus:outline-none focus:ring-1 ${formik.touched.email && formik.errors.email
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'bg-zinc-800 border-zinc-700 text-white focus:border-white focus:ring-white'
                                        }`}
                                    placeholder="you@example.com"
                                    {...formik.getFieldProps('email')}
                                />
                            </div>
                            {formik.touched.email && formik.errors.email && (
                                <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                                Password
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`block w-full rounded-md border py-2 pl-10 pr-10 sm:text-sm focus:outline-none focus:ring-1 ${formik.touched.password && formik.errors.password
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'bg-zinc-800 border-zinc-700 text-white focus:border-white focus:ring-white'
                                        }`}
                                    placeholder="••••••••"
                                    {...formik.getFieldProps('password')}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-zinc-400 hover:text-white"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                            {formik.touched.password && formik.errors.password && (
                                <p className="mt-1 text-xs text-red-500">{formik.errors.password}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-white focus:ring-white"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-300">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link href="/forgot-password" className="font-medium text-zinc-400 hover:text-white">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative flex w-full justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-zinc-400">
                            Don't have an account?{' '}
                        </span>
                        <Link 
                            href={redirectParam === 'checkout' ? '/signup?redirect=checkout' : '/signup'} 
                            className="font-medium text-white hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>
                </form>
                </div>
            </div>
        </div>
    );
}
