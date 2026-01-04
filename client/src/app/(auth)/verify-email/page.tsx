'use client';

import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { verifyEmail, clearError } from '@/store/features/auth';
import { mergeGuestCart, toggleCheckout } from '@/store/features/cart';
import { authService } from '@/services/auth.service';
import { useToast } from '@/contexts';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.user);
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const redirectParam = searchParams.get('redirect');

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
        } else {
            router.push('/signup');
        }
    }, [searchParams, router]);

    const validationSchema = Yup.object({
        code: Yup.string()
            .required('Verification code is required')
            .length(6, 'Code must be 6 digits')
            .matches(/^\d+$/, 'Code must contain only numbers'),
    });

    const formik = useFormik({
        initialValues: {
            code: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            dispatch(clearError());
            const resultAction = await dispatch(verifyEmail({ email, code: values.code }));

            if (verifyEmail.fulfilled.match(resultAction)) {
                await dispatch(mergeGuestCart());
                showToast('Email verified successfully!', 'success');
                
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

    const handleResendCode = async () => {
        if (!email) return;
        
        setResendLoading(true);
        try {
            await authService.resendVerificationCode(email);
            showToast('Verification code sent to your email', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to resend code', 'error');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-black">
            <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-xl shadow-lg border border-zinc-800">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        Verify Your Email
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        We've sent a 6-digit verification code to
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                        {email}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
                    <div className="rounded-md shadow-sm">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-zinc-300">
                                Verification Code
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Mail className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="code"
                                    name="code"
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
                            {error && (
                                <p className="mt-1 text-xs text-red-500">{error}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative flex w-full justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={resendLoading}
                            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                            {resendLoading ? 'Sending...' : "Didn't receive the code? Resend"}
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <Link 
                            href={redirectParam === 'checkout' ? '/login?redirect=checkout' : '/login'} 
                            className="flex items-center justify-center font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

