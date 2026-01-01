'use client';

import { useState, useRef } from 'react';
import { X, Star, Upload, Trash2, Film, Image as ImageIcon } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reviewData: any) => Promise<void>;
    productName: string;
    productImage: string;
    existingReview?: {
        id: number;
        rating: number;
        text: string;
        images?: string[];
        videos?: string[];
    } | null;
}

export default function ReviewModal({ isOpen, onClose, onSubmit, productName, productImage, existingReview }: ReviewModalProps) {
    const [loading, setLoading] = useState(false);
    const [mediaError, setMediaError] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const isEditing = !!existingReview;

    const formik = useFormik({
        initialValues: {
            rating: existingReview?.rating || 5,
            text: existingReview?.text || '',
            images: existingReview?.images || [] as string[],
            videos: existingReview?.videos || [] as string[],
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            rating: Yup.number().required('Rating is required').min(1, 'Please select a rating'),
            text: Yup.string().required('Review text is required').min(10, 'Review must be at least 10 characters'),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            try {
                await onSubmit(values);
                formik.resetForm();
                onClose();
            } catch (error) {
                console.error('Failed to submit review', error);
            } finally {
                setLoading(false);
            }
        },
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const files = event.target.files;
        if (!files) return;

        setMediaError('');
        const file = files[0];
        const reader = new FileReader();

        if (type === 'image') {
            if (!file.type.startsWith('image/')) {
                setMediaError('Please upload a valid image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setMediaError('Image size should be less than 5MB');
                return;
            }
            reader.onloadend = () => {
                const base64 = reader.result as string;
                if (formik.values.images.length < 3) {
                    formik.setFieldValue('images', [...formik.values.images, base64]);
                } else {
                    setMediaError('Maximum 3 images allowed');
                }
            };
        } else {
            if (!file.type.startsWith('video/')) {
                setMediaError('Please upload a valid video file');
                return;
            }
            if (file.size > 15 * 1024 * 1024) { // 15MB limit
                setMediaError('Video size should be less than 15MB');
                return;
            }
            reader.onloadend = () => {
                const base64 = reader.result as string;
                if (formik.values.videos.length < 1) {
                    formik.setFieldValue('videos', [...formik.values.videos, base64]);
                } else {
                    setMediaError('Maximum 1 video allowed');
                }
            };
        }

        reader.readAsDataURL(file);
        event.target.value = ''; // Reset input
    };

    const removeMedia = (index: number, type: 'image' | 'video') => {
        if (type === 'image') {
            const newImages = [...formik.values.images];
            newImages.splice(index, 1);
            formik.setFieldValue('images', newImages);
        } else {
            const newVideos = [...formik.values.videos];
            newVideos.splice(index, 1);
            formik.setFieldValue('videos', newVideos);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{isEditing ? 'Edit Review' : 'Write a Review'}</h3>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0">
                            <img src={productImage} alt={productName} className="h-full w-full object-cover" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Reviewing</p>
                            <h4 className="font-medium text-zinc-900 dark:text-white line-clamp-1">{productName}</h4>
                        </div>
                    </div>

                    <form onSubmit={formik.handleSubmit} className="space-y-6">
                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => formik.setFieldValue('rating', star)}
                                        className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                                    >
                                        <Star
                                            className={`h-8 w-8 ${star <= formik.values.rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300 dark:text-zinc-600'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text */}
                        <div>
                            <label htmlFor="text" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Review</label>
                            <textarea
                                id="text"
                                rows={4}
                                className={`w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-black/5 dark:bg-zinc-800 dark:text-white transition-all ${formik.touched.text && formik.errors.text ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white'}`}
                                placeholder="What did you like or dislike? What did you use this product for?"
                                {...formik.getFieldProps('text')}
                            />
                            {formik.touched.text && formik.errors.text && (
                                <p className="mt-1 text-xs text-red-500">{formik.errors.text}</p>
                            )}
                        </div>

                        {/* Media Upload */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Add Photos & Video</label>

                            <div className="flex gap-3 mb-4">
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium cursor-pointer"
                                    disabled={formik.values.images.length >= 3}
                                >
                                    <ImageIcon className="h-4 w-4" />
                                    Add Photos ({formik.values.images.length}/3)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => videoInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium cursor-pointer"
                                    disabled={formik.values.videos.length >= 1}
                                >
                                    <Film className="h-4 w-4" />
                                    Add Video ({formik.values.videos.length}/1)
                                </button>
                            </div>

                            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                            <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />

                            {mediaError && <p className="text-xs text-red-500 mb-3">{mediaError}</p>}

                            {/* Previews */}
                            <div className="flex flex-wrap gap-3">
                                {formik.values.images.map((img, idx) => (
                                    <div key={idx} className="relative h-20 w-20 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden group">
                                        <img src={img} alt="preview" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(idx, 'image')}
                                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {formik.values.videos.map((vid, idx) => (
                                    <div key={idx} className="relative h-20 w-20 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-black flex items-center justify-center group">
                                        <Film className="text-white/50 h-8 w-8" />
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(idx, 'video')}
                                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-xl bg-black text-white font-medium hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {loading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Review' : 'Submit Review')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
