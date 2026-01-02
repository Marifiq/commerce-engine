'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, ShoppingBag, Star, Edit2, Trash2, RotateCcw } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { reviewService } from '../../../services/reviewService';
import { productService } from '../../../services/productService';
import { Order, Review, Product } from '../../../types';
import { RootState, AppDispatch } from '../../../redux/store';
import { addItemToCart } from '../../../redux/features/cartSlice';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ReviewModal from '../../components/ReviewModal';
import MediaViewer from '../../components/MediaViewer';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/ToastContext';
import { Film, ExternalLink } from 'lucide-react';
import { resolveImageUrl } from '../../../utils/imageUtils';

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [userReviews, setUserReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [reorderingOrderId, setReorderingOrderId] = useState<number | null>(null);
    const [deleteReviewModal, setDeleteReviewModal] = useState<{ isOpen: boolean; reviewId: number | null; productId: number | null }>({ isOpen: false, reviewId: null, productId: null });
    const [reorderResultModal, setReorderResultModal] = useState<{
        isOpen: boolean;
        message: string;
        unavailableItems?: Array<{ name: string; category: string; requested: number; available: number }>
    }>({ isOpen: false, message: '' });
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { currentUser } = useSelector((state: RootState) => state.user);
    const { showToast } = useToast();

    const fetchData = async () => {
        try {
            const [ordersData, myReviewsResult] = await Promise.allSettled([
                orderService.getMyOrders(),
                currentUser ? reviewService.getMyReviews() : Promise.resolve([])
            ]);

            // Always set orders even if reviews fail
            if (ordersData.status === 'fulfilled') {
                const sorted = ordersData.value.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setOrders(sorted);
            } else {
                console.error("Failed to fetch orders:", ordersData.reason);
                setOrders([]);
            }

            // Set reviews if successful, otherwise use empty array
            if (myReviewsResult.status === 'fulfilled') {
                setUserReviews(myReviewsResult.value);
            } else {
                console.error("Failed to fetch reviews:", myReviewsResult.reason);
                setUserReviews([]);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            setOrders([]);
            setUserReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string; image: string } | null>(null);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [viewerState, setViewerState] = useState<{ isOpen: boolean; media: string; type: 'image' | 'video' }>({
        isOpen: false,
        media: '',
        type: 'image'
    });

    const handleWriteReview = (product: { id: number; name: string; image: string }, existingReview?: Review) => {
        setSelectedProduct(product);
        setEditingReview(existingReview || null);
        setIsReviewOpen(true);
    };

    const handleEditReview = (product: { id: number; name: string; image: string }, review: Review) => {
        handleWriteReview(product, review);
    };

    const handleDeleteReview = (reviewId: number, productId: number) => {
        setDeleteReviewModal({ isOpen: true, reviewId, productId });
    };

    const handleConfirmDeleteReview = async () => {
        if (!deleteReviewModal.reviewId || !deleteReviewModal.productId) return;

        const reviewId = deleteReviewModal.reviewId;
        const productId = deleteReviewModal.productId;

        // Optimistically remove the review from state immediately
        setUserReviews(prevReviews => prevReviews.filter(r => r.id !== reviewId));
        setDeleteReviewModal({ isOpen: false, reviewId: null, productId: null });

        try {
            await reviewService.deleteReview(reviewId);
            // Refresh reviews to ensure consistency (but state is already updated)
            if (currentUser) {
                const myReviews = await reviewService.getMyReviews();
                setUserReviews(myReviews);
            }
            showToast('Review deleted successfully', 'success');
        } catch (error) {
            console.error("Failed to delete review", error);
            // Revert on error by refreshing
            if (currentUser) {
                try {
                    const myReviews = await reviewService.getMyReviews();
                    setUserReviews(myReviews);
                } catch (refreshError) {
                    console.error("Failed to refresh reviews after delete error", refreshError);
                }
            }
            showToast('Failed to delete review. Please try again.', 'error');
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

    const handleReviewSubmit = async (reviewData: any) => {
        if (!selectedProduct) return;

        try {
            if (editingReview) {
                // Update existing review
                await reviewService.updateReview(editingReview.id, reviewData);
            } else {
                // Create new review
                await reviewService.createReview({
                    ...reviewData,
                    productId: selectedProduct.id
                });
            }

            // Refresh reviews and close modal
            if (currentUser) {
                const myReviews = await reviewService.getMyReviews();
                setUserReviews(myReviews);
            }
            setIsReviewOpen(false);
            setEditingReview(null);
            setSelectedProduct(null);
            showToast(editingReview ? 'Review updated successfully!' : 'Review submitted successfully!', 'success');
        } catch (error: any) {
            console.error("Failed to submit review", error);
            const errorMessage = error.message || 'Failed to submit review. Please try again.';
            showToast(errorMessage, 'error');
            throw error;
        }
    };

    const handleCloseModal = () => {
        setIsReviewOpen(false);
        setEditingReview(null);
        setSelectedProduct(null);
    };

    const handleReorder = async (order: Order) => {
        setReorderingOrderId(order.id);

        try {
            // Fetch current product details to check stock
            const productChecks = await Promise.allSettled(
                order.items.map(item => productService.getProduct(item.productId))
            );

            const availableItems: Array<{ product: Product; quantity: number; stock: number }> = [];
            const unavailableItems: Array<{ name: string; category: string; requested: number; available: number }> = [];

            // Check stock for each item
            for (let i = 0; i < order.items.length; i++) {
                const item = order.items[i];
                const productCheck = productChecks[i];

                if (productCheck.status === 'fulfilled') {
                    const product = productCheck.value as Product;
                    const requestedQty = item.quantity;
                    const availableStock = product.stock || 0;

                    // Check if stock matches the requested quantity
                    if (availableStock >= requestedQty) {
                        // Full stock available - add to cart
                        availableItems.push({
                            product: product,
                            quantity: requestedQty,
                            stock: availableStock
                        });
                    } else if (availableStock > 0) {
                        // Partial stock available - add what's available but mark as unavailable
                        availableItems.push({
                            product: product,
                            quantity: availableStock,
                            stock: availableStock
                        });
                        unavailableItems.push({
                            name: product.name,
                            category: product.category || 'Uncategorized',
                            requested: requestedQty,
                            available: availableStock
                        });
                    } else {
                        // Out of stock completely
                        unavailableItems.push({
                            name: product.name,
                            category: product.category || 'Uncategorized',
                            requested: requestedQty,
                            available: 0
                        });
                    }
                } else {
                    // Product not found or error fetching
                    unavailableItems.push({
                        name: item.product?.name || 'Unknown Product',
                        category: item.product?.category || 'Uncategorized',
                        requested: item.quantity,
                        available: 0
                    });
                }
            }

            // Add available items to cart
            const failedItems: string[] = [];
            if (availableItems.length > 0) {
                for (const item of availableItems) {
                    try {
                        await dispatch(addItemToCart({
                            product: item.product,
                            quantity: item.quantity
                        })).unwrap();
                    } catch (error: any) {
                        console.error(`Failed to add ${item.product.name} to cart:`, error);
                        failedItems.push(item.product.name);
                        // Remove from available items count since it failed
                        const index = availableItems.findIndex(ai => ai.product.id === item.product.id);
                        if (index > -1) {
                            // Get product category for the failed item
                            const failedProduct = order.items.find(oi => oi.productId === item.product.id);
                            availableItems.splice(index, 1);
                            unavailableItems.push({
                                name: item.product.name,
                                category: failedProduct?.product?.category || 'Uncategorized',
                                requested: item.quantity,
                                available: item.stock
                            });
                        }
                    }
                }
            }

            // Show feedback message
            let message = '';

            if (availableItems.length > 0 && unavailableItems.length === 0) {
                message = `All items from order #${order.id} have been added to your cart!`;
                showToast(message, 'success');
            } else if (availableItems.length > 0 && unavailableItems.length > 0) {
                message = `${availableItems.length} item(s) added to cart. ${unavailableItems.length} item(s) are out of stock or unavailable.`;
                setReorderResultModal({ isOpen: true, message, unavailableItems });
            } else {
                message = `Sorry, all items from order #${order.id} are currently out of stock. Please shop for alternatives in the relevant categories.`;
                setReorderResultModal({ isOpen: true, message, unavailableItems });
            }
        } catch (error: any) {
            console.error('Failed to reorder:', error);
            const errorMessage = error?.message || 'Failed to reorder. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setReorderingOrderId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    const getProductReview = (productId: number) => {
        return userReviews.find(r => r.productId === productId);
    };

    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-white dark:bg-black px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="mx-auto h-24 w-24 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-6">
                        <ShoppingBag className="h-10 w-10 text-zinc-400" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">No orders yet</h2>
                    <p className="text-zinc-500 mb-8">You haven't placed any orders yet. Start shopping to fill your wardrobe.</p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-xl bg-black px-8 py-3 text-base font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'text-black bg-zinc-100 dark:bg-zinc-800 dark:text-white';
            case 'shipped': return 'text-zinc-700 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300';
            case 'processed': return 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400';
            case 'cancelled': return 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-500';
            default: return 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return <CheckCircle className="h-4 w-4 mr-1.5" />;
            case 'shipped': return <Truck className="h-4 w-4 mr-1.5" />;
            case 'cancelled': return <XCircle className="h-4 w-4 mr-1.5" />;
            default: return <Clock className="h-4 w-4 mr-1.5" />;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24">
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-8">My Orders</h1>

                <div className="space-y-6">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                                                Order #{order.id}
                                            </h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status || 'pending')}`}>
                                                {getStatusIcon(order.status || 'pending')}
                                                {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-500">
                                            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:items-end gap-3">
                                        <div className="text-left sm:text-right">
                                            <p className="text-sm text-zinc-500 mb-1">Total Amount</p>
                                            <p className="text-xl font-bold text-zinc-900 dark:text-white">
                                                ${((order.totalAmount ?? order.total) || 0).toFixed(2)}
                                            </p>
                                        </div>
                                        {(order.status || 'pending') === 'delivered' && (
                                            <button
                                                onClick={() => handleReorder(order)}
                                                disabled={reorderingOrderId === order.id}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            >
                                                {reorderingOrderId === order.id ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
                                                        <span>Adding...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <RotateCcw className="h-4 w-4" />
                                                        <span>Re-order</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                                    <div className="flow-root">
                                        <ul className="-my-6 divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {order.items.map((item) => {
                                                const review = getProductReview(item.productId);
                                                return (
                                                    <li key={item.id} className="py-6">
                                                        <div className="flex">
                                                            <Link href={`/product/${item.productId}`} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white transition-colors cursor-pointer">
                                                                <img
                                                                    src={resolveImageUrl(item.product?.image || '') || '/images/placeholder.jpg'}
                                                                    alt={item.product?.name}
                                                                    className="h-full w-full object-cover object-center"
                                                                />
                                                            </Link>
                                                            <div className="ml-4 flex flex-1 flex-col">
                                                                <div>
                                                                    <div className="flex justify-between text-base font-medium text-zinc-900 dark:text-white">
                                                                        <h3>
                                                                            <Link href={`/product/${item.productId}`} className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer">
                                                                                {item.product?.name}
                                                                            </Link>
                                                                        </h3>
                                                                        <p className="ml-4">${item.price || item.product?.price || 0}</p>
                                                                    </div>
                                                                    <p className="mt-1 text-sm text-zinc-500">{item.product?.category}</p>
                                                                </div>
                                                                <div className="flex flex-1 items-end justify-between text-sm">
                                                                    <p className="text-zinc-500">Qty {item.quantity}</p>
                                                                    {(order.status || 'pending') === 'delivered' && !review && (
                                                                        <button
                                                                            onClick={() => handleWriteReview({ id: item.productId, name: item.product?.name || '', image: item.product?.image || '' })}
                                                                            className="inline-flex items-center px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200 cursor-pointer"
                                                                        >
                                                                            Write a Review
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {review && (
                                                            <div key={`review-${review.id}`} className="mt-4 ml-20 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex">
                                                                            {[0, 1, 2, 3, 4].map((star) => (
                                                                                <Star
                                                                                    key={star}
                                                                                    className={`h-3 w-3 ${review.rating > star ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Your Review</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditReview({ id: item.productId, name: item.product?.name || '', image: item.product?.image || '' }, review)}
                                                                            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-all cursor-pointer"
                                                                            title="Edit review"
                                                                        >
                                                                            <Edit2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteReview(review.id, item.productId)}
                                                                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all cursor-pointer"
                                                                            title="Delete review"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 italic mb-4">"{review.text}"</p>

                                                                {/* Media Display */}
                                                                {(review.images?.length || 0) + (review.videos?.length || 0) > 0 && (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {review.images?.map((img, idx) => (
                                                                            <button
                                                                                key={`img-${idx}`}
                                                                                onClick={() => handleMediaClick(img)}
                                                                                className="relative h-12 w-12 rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden group cursor-pointer hover:border-black dark:hover:border-white transition-all shadow-sm focus:outline-none"
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
                                                                                className="relative h-12 w-12 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center group cursor-pointer hover:border-black dark:hover:border-white transition-all shadow-sm focus:outline-none"
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
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedProduct && (
                <ReviewModal
                    isOpen={isReviewOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleReviewSubmit}
                    productName={selectedProduct.name}
                    productImage={selectedProduct.image}
                    existingReview={editingReview ? {
                        id: editingReview.id,
                        rating: editingReview.rating,
                        text: editingReview.text,
                        images: editingReview.images,
                        videos: editingReview.videos,
                    } : null}
                />
            )}

            <MediaViewer
                isOpen={viewerState.isOpen}
                onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
                media={viewerState.media}
                mediaType={viewerState.type}
            />

            {/* Delete Review Confirmation Modal */}
            <Modal
                isOpen={deleteReviewModal.isOpen}
                onClose={() => setDeleteReviewModal({ isOpen: false, reviewId: null, productId: null })}
                onConfirm={handleConfirmDeleteReview}
                title="Delete Review"
                message="Are you sure you want to delete this review? This action cannot be undone."
                confirmText="Delete Review"
                cancelText="Cancel"
                type="danger"
            />

            {/* Reorder Result Modal */}
            <Modal
                isOpen={reorderResultModal.isOpen}
                onClose={() => setReorderResultModal({ isOpen: false, message: '', unavailableItems: undefined })}
                onConfirm={() => setReorderResultModal({ isOpen: false, message: '', unavailableItems: undefined })}
                title="Reorder Status"
                message={
                    <div className="text-left w-full">
                        <p className="mb-4 text-sm leading-relaxed">{reorderResultModal.message}</p>
                        {reorderResultModal.unavailableItems && reorderResultModal.unavailableItems.length > 0 && (
                            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                                    Out of Stock Items:
                                </p>
                                <div className="space-y-3">
                                    {reorderResultModal.unavailableItems.map((item, index) => (
                                        <div key={index} className="flex items-start justify-between gap-3 p-2 bg-white dark:bg-zinc-900 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {item.available === 0
                                                        ? `Out of stock (requested: ${item.requested})`
                                                        : `Only ${item.available} available (requested: ${item.requested})`
                                                    }
                                                </p>
                                            </div>
                                            <Link
                                                href={`/shop?category=${encodeURIComponent(item.category)}`}
                                                onClick={() => setReorderResultModal({ isOpen: false, message: '', unavailableItems: undefined })}
                                                className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
                                            >
                                                Shop {item.category}
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 italic">
                                    Click on "Shop [Category]" to browse similar products in that category.
                                </p>
                            </div>
                        )}
                    </div>
                }
                confirmText="OK"
                cancelText=""
                type="info"
            />
        </div>
    );
}
