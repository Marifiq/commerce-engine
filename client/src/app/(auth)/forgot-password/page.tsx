'use client';

import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '../../components/ToastContext';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const validationSchema = Yup.object({
        email: Yup.string().email('Invalid email address').required('Email is required'),
    });

    const formik = useFormik({
        initialValues: {
            email: '',
        },
        validationSchema,
        onSubmit: (values) => {
            console.log('Password Reset Request:', values);
            // Mock sending email
            setTimeout(() => {
                showToast('If an account exists with this email, a password reset link has been sent.', 'info');
                router.push('/login');
            }, 500);
        },
    });

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg dark:bg-zinc-900">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Enter your email address to receive a secure password reset link
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
                    <div className="rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Email address
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Mail className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    className={`block w-full rounded-md border py-2 pl-10 pr-3 sm:text-sm focus:outline-none focus:ring-1 ${formik.touched.email && formik.errors.email
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-zinc-300 focus:border-black focus:ring-black dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'
                                        }`}
                                    placeholder="you@example.com"
                                    {...formik.getFieldProps('email')}
                                />
                            </div>
                            {formik.touched.email && formik.errors.email && (
                                <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-md bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 cursor-pointer dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        >
                            Send Reset Link
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <Link href="/login" className="flex items-center justify-center font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
