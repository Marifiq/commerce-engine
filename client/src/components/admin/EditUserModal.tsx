'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { LoadingSpinner } from '@/components/ui';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string }) => Promise<void>;
    user: { name: string; email: string } | null;
}

const validationSchema = Yup.object({
    name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long')
});

export function EditUserModal({ isOpen, onClose, onSave, user }: EditUserModalProps) {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in fade-in duration-200 border border-zinc-200 dark:border-zinc-800">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
                        Edit User Profile
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                <Formik
                    initialValues={{
                        name: user.name
                    }}
                    validationSchema={validationSchema}
                    onSubmit={async (values, { setSubmitting }) => {
                        try {
                            await onSave(values);
                            onClose();
                        } catch (error) {
                            console.error('Failed to update user:', error);
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form className="p-6 space-y-4">
                            {/* Info Alert */}
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                                <AlertCircle size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                    <strong className="font-bold text-zinc-900 dark:text-white">Production Note:</strong> Email changes require user verification and cannot be modified directly by admins.
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Full Name
                                </label>
                                <Field
                                    name="name"
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                                    placeholder="Enter full name"
                                />
                                <ErrorMessage
                                    name="name"
                                    component="div"
                                    className="mt-1 text-xs text-red-500 font-medium"
                                />
                            </div>

                            {/* Display Email (Read-only) */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Email Address
                                </label>
                                <div className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 cursor-not-allowed">
                                    {user.email}
                                </div>
                                <p className="mt-1 text-xs text-zinc-400">Email cannot be changed by admins</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 text-zinc-500 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-black/5 cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting && (
                                        <LoadingSpinner size="small" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}
