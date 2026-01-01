'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
    loading?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info',
    loading = false
}: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in fade-in duration-200 border border-zinc-200 dark:border-zinc-800">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                        <AlertTriangle size={28} className="text-black dark:text-white" />
                    </div>

                    <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white mb-2">
                        {title}
                    </h2>

                    <div className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
                        {message}
                    </div>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 text-zinc-500 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-black/5 cursor-pointer flex items-center justify-center gap-2 ${type === 'danger'
                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                : 'bg-black text-white dark:bg-white dark:text-black'
                                } hover:opacity-90 disabled:opacity-50`}
                        >
                            {loading && (
                                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            )}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
