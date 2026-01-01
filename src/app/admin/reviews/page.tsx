'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../utils/api';
import {
    Search,
    MessageSquare,
    Star,
    Trash2,
    Loader2,
    CheckCircle,
    XCircle,
    User,
    Film,
    Image as ImageIcon,
    ExternalLink
} from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { Modal } from '@/app/components/Modal';
import { Pagination } from '@/app/components/Pagination';
import MediaViewer from '@/app/components/MediaViewer';

interface Review {
    id: number | string;
    productId: number | string;
    user: string;
    rating: number;
    text: string;
    isApproved: boolean;
    images?: string[];
    videos?: string[];
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | number | null>(null);
    const [togglingId, setTogglingId] = useState<string | number | null>(null);
    const { showToast } = useToast();

    const [sortBy, setSortBy] = useState<string>('newest');


    // Modal state
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        reviewId: string | number | null;
    }>({
        isOpen: false,
        reviewId: null
    });

    const [viewerState, setViewerState] = useState<{ isOpen: boolean; media: string; type: 'image' | 'video' }>({
        isOpen: false,
        media: '',
        type: 'image'
    });

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await apiFetch('/reviews?includePending=true');
            setReviews(res.data.data);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            showToast('Failed to load reviews', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: number | string) => {
        setDeleteModal({
            isOpen: true,
            reviewId: id
        });
    };

    const handleConfirmDelete = async () => {
        const id = deleteModal.reviewId;
        if (!id) return;

        setDeleteModal(prev => ({ ...prev, isOpen: false }));
        setDeletingId(id);
        try {
            await apiFetch(`/reviews/${id}`, { method: 'DELETE' });
            showToast('Review deleted successfully', 'success');
            await fetchReviews();
        } catch (error) {
            console.error('Failed to delete review:', error);
            showToast('Failed to delete review', 'error');
        } finally {
            setDeletingId(null);
        }
    };



    const handleToggleApproval = async (id: number | string, currentStatus: boolean) => {
        setTogglingId(id);
        try {
            await apiFetch(`/reviews/${id}/status`, {
                method: 'PATCH',
                body: { isApproved: !currentStatus }
            });
            await fetchReviews();
            showToast(`Review ${!currentStatus ? 'approved' : 'unapproved'} successfully`, 'success');
        } catch (error) {
            console.error('Failed to update review status:', error);
            showToast('Failed to update review status', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleMediaClick = (media: string) => {
        const type = (media.startsWith('data:video/') || media.toLowerCase().endsWith('.mp4')) ? 'video' : 'image';
        setViewerState({
            isOpen: true,
            media,
            type: type as 'image' | 'video'
        });
    };

    const filteredReviews = reviews.filter(r =>
        r.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.productId.toString().includes(searchTerm)
    ).sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return Number(b.id) - Number(a.id);
            case 'oldest':
                return Number(a.id) - Number(b.id);
            case 'rating-high':
                return b.rating - a.rating;
            case 'rating-low':
                return a.rating - b.rating;
            case 'user-asc':
                return a.user.localeCompare(b.user);
            case 'user-desc':
                return b.user.localeCompare(a.user);
            default:
                return 0;
        }
    });

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
    const paginatedReviews = filteredReviews.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Reviews</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Moderate and manage customer feedback.</p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all focus-within:border-black dark:focus-within:border-white flex flex-col sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search reviews..."
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-0 transition-all text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="mt-4 sm:mt-0 sm:ml-4 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-0 transition-all text-zinc-900 dark:text-white outline-none cursor-pointer text-sm font-medium"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="rating-high">Highest Rated</option>
                    <option value="rating-low">Lowest Rated</option>
                    <option value="user-asc">User (A-Z)</option>
                    <option value="user-desc">User (Z-A)</option>
                </select>
            </div>

            {/* Reviews List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center">
                        <Loader2 className="animate-spin text-black dark:text-white" size={32} />
                    </div>
                ) : paginatedReviews.length > 0 ? paginatedReviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-default">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                        <User size={14} className="text-zinc-400" />
                                    </div>
                                    <span className="font-bold text-zinc-900 dark:text-white text-xs truncate max-w-[100px]">
                                        {review.user}
                                    </span>
                                </div>

                                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${review.isApproved ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                                    {review.isApproved ? 'Approved' : 'Pending'}
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={12}
                                        className={i < review.rating ? "fill-black text-black dark:fill-white dark:text-white" : "text-zinc-200 dark:text-zinc-700"}
                                    />
                                ))}
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm italic mb-4 leading-relaxed">
                                "{review.text}"
                            </p>

                            {/* Media Display */}
                            {(review.images?.length || 0) + (review.videos?.length || 0) > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {review.images?.map((img, idx) => (
                                        <button
                                            key={`img-${idx}`}
                                            onClick={() => handleMediaClick(img)}
                                            className="relative h-12 w-12 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden group cursor-pointer hover:border-black dark:hover:border-white transition-all shadow-sm focus:outline-none"
                                        >
                                            <img src={img} alt="review" className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                                <ExternalLink size={12} className="text-white opacity-0 group-hover:opacity-100" />
                                            </div>
                                        </button>
                                    ))}
                                    {review.videos?.map((vid, idx) => (
                                        <button
                                            key={`vid-${idx}`}
                                            onClick={() => handleMediaClick(vid)}
                                            className="relative h-12 w-12 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center group cursor-pointer hover:border-black dark:hover:border-white transition-all shadow-sm focus:outline-none"
                                        >
                                            <Film size={16} className="text-zinc-400 group-hover:text-black dark:group-hover:text-white" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                                <ExternalLink size={12} className="text-white opacity-0 group-hover:opacity-100" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                SKU: <span className="text-black dark:text-white">{review.productId}</span>
                            </span>
                            <button
                                onClick={() => handleToggleApproval(review.id, review.isApproved)}
                                disabled={togglingId === review.id}
                                className={`p-2 rounded-lg transition-all cursor-pointer ${review.isApproved ? 'text-zinc-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10' : 'text-zinc-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10'}`}
                                title={review.isApproved ? "Unapprove Review" : "Approve Review"}
                            >
                                {togglingId === review.id ? <Loader2 className="animate-spin" size={18} /> : review.isApproved ? <XCircle size={18} /> : <CheckCircle size={18} />}
                            </button>
                            <button
                                onClick={() => handleDeleteClick(review.id)}
                                disabled={deletingId === review.id}
                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all cursor-pointer"
                            >
                                {deletingId === review.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-12 text-center text-zinc-500">
                        No reviews found.
                    </div>
                )}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, reviewId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Review"
                message="Are you sure you want to delete this review? This action will permanently remove the customer feedback."
                confirmText="Delete Review"
                type="danger"
            />

            <MediaViewer
                isOpen={viewerState.isOpen}
                onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
                media={viewerState.media}
                mediaType={viewerState.type}
            />
        </div>
    );
}
