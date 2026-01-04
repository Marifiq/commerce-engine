'use client';

import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MediaViewerProps {
    isOpen: boolean;
    onClose: () => void;
    media: string;
    mediaType: 'image' | 'video';
}

export default function MediaViewer({ isOpen, onClose, media, mediaType }: MediaViewerProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer z-[110]"
            >
                <X size={24} />
            </button>

            <div
                className="relative max-w-5xl w-full max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {mediaType === 'image' ? (
                    <img
                        src={media}
                        alt="Preview"
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                    />
                ) : (
                    <video
                        src={media}
                        controls
                        autoPlay
                        className="max-w-full max-h-[85vh] rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                    />
                )}
            </div>
        </div>
    );
}
