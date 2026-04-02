'use client';

import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/contexts';
import { authService } from '@/services/auth.service';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
        } else {
            router.push('/forgot-password');
        }
    }, [searchParams, router]);

    const validationSchema = Yup.object({
        code: Yup.string()
            .required('Reset code is required')
            .length(6, 'Code must be 6 digits')
            .matches(/^\d+$/, 'Code must contain only numbers'),
        password: Yup.string()
            .min(8, 'Password must be at least 8 characters')
            .required('Password is required'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('password')], 'Passwords must match')
            .required('Confirm Password is required'),
    });

    const formik = useFormik({
        initialValues: {
            code: '',
            password: '',
            confirmPassword: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            if (!email) return;
            
            setLoading(true);
            try {
                const response = await authService.resetPassword(email, values.code, values.password);
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                showToast('Password reset successfully!', 'success');
                router.push('/');
            } catch (err: any) {
                showToast(err.message || 'Failed to reset password', 'error');
            } finally {
                setLoading(false);
            }
        },
    });

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-black">
            <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-xl shadow-lg border border-zinc-800">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Enter the code sent to your email and your new password
                    </p>
                    {email && (
                        <p className="mt-1 text-sm font-medium text-white">
                            {email}
                        </p>
                    )}
                </div>

                <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        {/* Code Field */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-zinc-300">
                                Reset Code
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Mail className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="code"
                                    type="text"
                                    maxLength={6}
                                    className={`block w-full rounded-md border py-2 pl-10 pr-3 sm:text-sm focus:outline-none focus:ring-1 ${formik.touched.code && formik.errors.code
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'bg-zinc-800 border-zinc-700 text-white focus:border-white focus:ring-white'
                                        }`}
                                    placeholder="000000"
                                    {...formik.getFieldProps('code')}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, ''); // Only numbers
                                        formik.setFieldValue('code', value);
                                    }}
                                />
                            </div>
                            {formik.touched.code && formik.errors.code && (
                                <p className="mt-1 text-xs text-red-500">{formik.errors.code}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                                New Password
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
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

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
                                Confirm Password
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    className={`block w-full rounded-md border py-2 pl-10 pr-10 sm:text-sm focus:outline-none focus:ring-1 ${formik.touched.confirmPassword && formik.errors.confirmPassword
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'bg-zinc-800 border-zinc-700 text-white focus:border-white focus:ring-white'
                                        }`}
                                    placeholder="••••••••"
                                    {...formik.getFieldProps('confirmPassword')}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-zinc-400 hover:text-white"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500">{formik.errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative flex w-full justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <Link href="/login" className="flex items-center justify-center font-medium text-zinc-400 hover:text-white transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
