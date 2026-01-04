'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: number) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-xs sm:max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-right fade-in duration-300"
                >
                    <div className="shrink-0 mt-0.5">
                        {toast.type === 'success' && <CheckCircle size={18} className="text-black dark:text-white" />}
                        {toast.type === 'error' && <AlertCircle size={18} className="text-black dark:text-white" />}
                        {toast.type === 'info' && <Info size={18} className="text-black dark:text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                            {toast.message}
                        </p>
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="shrink-0 text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}

