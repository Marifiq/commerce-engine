'use client';

import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/features/userSlice';
import { users } from '../../data/users';

export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');

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
        onSubmit: (values) => {
            setLoginError('');
            // Authenticate against dummy users
            const user = users.find(
                (u) => u.email === values.email && u.password === values.password
            );

            if (user) {
                console.log('Login Successful:', user);
                // Dispatch login action
                dispatch(login({ id: user.id, name: user.name, email: user.email }));
                setTimeout(() => {
                    alert(`Welcome back, ${user.name}!`);
                    router.push('/');
                }, 100);
            } else {
                setLoginError('Invalid email or password');
            }
        },
    });

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg dark:bg-zinc-900">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Please sign in to your account
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                        (Try: user@example.com / password123)
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
                    {loginError && (
                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md text-center border border-red-200">
                            {loginError}
                        </div>
                    )}
                    <div className="space-y-4 rounded-md shadow-sm">
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

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Password
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    className={`block w-full rounded-md border py-2 pl-10 pr-10 sm:text-sm focus:outline-none focus:ring-1 ${formik.touched.password && formik.errors.password
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-zinc-300 focus:border-black focus:ring-black dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'
                                        }`}
                                    placeholder="••••••••"
                                    {...formik.getFieldProps('password')}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white"
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
                                className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black dark:border-zinc-700 dark:bg-zinc-800"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-900 dark:text-zinc-300">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link href="/forgot-password" className="font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-md bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 cursor-pointer dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        >
                            Sign in
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">
                            Don't have an account?{' '}
                        </span>
                        <Link href="/signup" className="font-medium text-black hover:underline dark:text-white">
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
