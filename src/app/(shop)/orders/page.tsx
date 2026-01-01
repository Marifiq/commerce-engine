'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, ShoppingBag, Star } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { reviewService } from '../../../services/reviewService';
import { Order, Review } from '../../../types';
import { RootState } from '../../../redux/store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ReviewModal from '../../components/ReviewModal';
import MediaViewer from '../../components/MediaViewer';
import { Film, ExternalLink } from 'lucide-react';

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [userReviews, setUserReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { currentUser } = useSelector((state: RootState) => state.user);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, allReviews] = await Promise.all([
                    orderService.getMyOrders(),
                    currentUser ? reviewService.getAllReviews() : Promise.resolve([])
                ]);

                const sorted = ordersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setOrders(sorted);

                // Filter reviews by current user
                if (currentUser) {
                    const filtered = allReviews.filter(r =>
                        typeof r.user === 'string' ? r.user === currentUser.email : false
                    );
                    setUserReviews(filtered);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string; image: string } | null>(null);
    const [viewerState, setViewerState] = useState<{ isOpen: boolean; media: string; type: 'image' | 'video' }>({
        isOpen: false,
        media: '',
        type: 'image'
    });

    const handleWriteReview = (product: { id: number; name: string; image: string }) => {
        setSelectedProduct(product);
        setIsReviewOpen(true);
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
            await reviewService.createReview({
                ...reviewData,
                productId: selectedProduct.id
            });
            // Redirect to product page to see the review
            router.push(`/product/${selectedProduct.id}`);
        } catch (error) {
            console.error("Failed to submit review", error);
            throw error;
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
            case 'delivered': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
            case 'shipped': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
            case 'processed': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400';
            case 'cancelled': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
            default: return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
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
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-500">
                                            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-sm text-zinc-500 mb-1">Total Amount</p>
                                        <p className="text-xl font-bold text-zinc-900 dark:text-white">
                                            ${order.total.toFixed(2)}
                                        </p>
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
                                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                                                                <img
                                                                    src={item.product?.image || '/images/placeholder.jpg'}
                                                                    alt={item.product?.name}
                                                                    className="h-full w-full object-cover object-center"
                                                                />
                                                            </div>
                                                            <div className="ml-4 flex flex-1 flex-col">
                                                                <div>
                                                                    <div className="flex justify-between text-base font-medium text-zinc-900 dark:text-white">
                                                                        <h3>
                                                                            <Link href={`/product/${item.productId}`}>
                                                                                {item.product?.name}
                                                                            </Link>
                                                                        </h3>
                                                                        <p className="ml-4">${item.product?.price}</p>
                                                                    </div>
                                                                    <p className="mt-1 text-sm text-zinc-500">{item.product?.category}</p>
                                                                </div>
                                                                <div className="flex flex-1 items-end justify-between text-sm">
                                                                    <p className="text-zinc-500">Qty {item.quantity}</p>
                                                                    {order.status === 'delivered' && !review && (
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
                                                            <div className="mt-4 ml-20 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700">
                                                                <div className="flex items-center gap-2 mb-2">
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
                    onClose={() => setIsReviewOpen(false)}
                    onSubmit={handleReviewSubmit}
                    productName={selectedProduct.name}
                    productImage={selectedProduct.image}
                />
            )}

            <MediaViewer
                isOpen={viewerState.isOpen}
                onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
                media={viewerState.media}
                mediaType={viewerState.type}
            />
        </div>
    );
}
