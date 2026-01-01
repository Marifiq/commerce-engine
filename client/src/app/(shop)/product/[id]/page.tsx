'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Star, Shield, Truck, RefreshCcw, Film, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { addItemToCart } from '../../../../redux/features/cartSlice';
import { productService } from '../../../../services/productService';
import { reviewService } from '../../../../services/reviewService';
import { Product, Review } from '../../../../types';
import { AppDispatch } from '../../../../redux/store';
import { resolveImageUrl } from '../../../../utils/imageUtils';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import MediaViewer from '../../../components/MediaViewer';

export default function ProductPage() {
    const params = useParams();
    const id = params.id as string;
    const dispatch = useDispatch<AppDispatch>();

    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewerState, setViewerState] = useState<{ isOpen: boolean; media: string; type: 'image' | 'video' }>({
        isOpen: false,
        media: '',
        type: 'image'
    });

    const fetchProductData = async () => {
        try {
            const [productData, reviewsData] = await Promise.all([
                productService.getProduct(id),
                reviewService.getProductReviews(id)
            ]);
            setProduct(productData);
            setReviews(reviewsData);
        } catch (err: any) {
            setError(err.message || 'Product not found');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const reviewsData = await reviewService.getProductReviews(id);
            setReviews(reviewsData);
        } catch (err) {
            console.error('Failed to refetch reviews', err);
        }
    };

    useEffect(() => {
        fetchProductData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center dark:bg-black">
            <LoadingSpinner size="large" />
        </div>
    );

    if (error || !product) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center dark:bg-black px-4">
            <h1 className="text-2xl font-bold mb-4">{error || 'Product not found'}</h1>
            <Link href="/" className="text-black underline dark:text-white">Back to Home</Link>
        </div>
    );

    const handleAddToCart = () => {
        dispatch(addItemToCart({ productId: Number(id), quantity: 1 }));
    };

    const handleMediaClick = (media: string) => {
        const type = (media.startsWith('data:video/') || media.toLowerCase().endsWith('.mp4')) ? 'video' : 'image';
        setViewerState({
            isOpen: true,
            media,
            type: type as 'image' | 'video'
        });
    };

    const imageUrl = resolveImageUrl(product.image);

    return (
        <div className="bg-white dark:bg-black min-h-screen pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-black mb-8 dark:hover:text-white transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to collection
                </Link>

                <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
                    {/* Image gallery */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 shadow-sm">
                        <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover object-center"
                        />
                    </div>

                    {/* Product info */}
                    <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{product.name}</h1>
                                <p className="mt-2 text-sm text-zinc-500 uppercase tracking-widest">{product.category}</p>
                            </div>
                            <p className="text-3xl font-bold text-zinc-900 dark:text-white">${product.price}</p>
                        </div>

                        <div className="mt-6">
                            <h3 className="sr-only">Description</h3>
                            <div className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                {product.description || "Crafted from premium heavyweight cotton, this essential piece features a relaxed silhouette and reinforced stitching for lasting durability. A versatile addition to any wardrobe, designed for comfort and style."}
                            </div>
                        </div>

                        <div className="mt-8 flex items-center space-x-2">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`${(product.averageRating || 0) > i ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-zinc-700'
                                            } h-4 w-4 shrink-0`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-zinc-500">({product.reviewCount || 0} reviews)</span>
                        </div>

                        <div className="mt-10">
                            <button
                                onClick={handleAddToCart}
                                className="flex w-full items-center justify-center rounded-xl bg-black px-8 py-4 text-base font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all transform active:scale-95 cursor-pointer"
                            >
                                <ShoppingBag className="mr-3 h-5 w-5" />
                                Add to Cart
                            </button>
                        </div>

                        {/* Feature grid */}
                        <div className="mt-12 grid grid-cols-1 gap-6 border-t border-zinc-100 dark:border-zinc-800 pt-8 sm:grid-cols-3">
                            <div className="flex flex-col items-center text-center">
                                <Truck className="h-6 w-6 mb-2 text-zinc-900 dark:text-white" />
                                <span className="text-xs font-medium">Free Shipping</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <Shield className="h-6 w-6 mb-2 text-zinc-900 dark:text-white" />
                                <span className="text-xs font-medium">Secure Checkout</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <RefreshCcw className="h-6 w-6 mb-2 text-zinc-900 dark:text-white" />
                                <span className="text-xs font-medium">30-Day Returns</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-16 border-t border-zinc-100 dark:border-zinc-800 pt-16">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Customer Reviews</h2>
                            <div className="flex items-center mt-2 text-sm text-zinc-500">
                                <div className="flex items-center mr-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${(product.averageRating || 0) > i ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`}
                                        />
                                    ))}
                                </div>
                                <span>Based on {product.reviewCount || 0} reviews</span>
                            </div>
                        </div>
                    </div>

                    {reviews.length === 0 ? (
                        <p className="text-zinc-500">No reviews yet for this product. Be the first to share your thoughts!</p>
                    ) : (
                        <div className="space-y-8 max-w-3xl">
                            {reviews.map((review) => (
                                <div key={review.id} className="border-b border-zinc-50 dark:border-zinc-900 pb-8 last:border-0">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="flex items-center">
                                            {[0, 1, 2, 3, 4].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`h-4 w-4 ${review.rating > star ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{(typeof review.user === 'object' && review.user?.name) || 'Verified Buyer'}</span>
                                        <span className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed italic mb-4">"{review.text}"</p>

                                    {/* Media Display */}
                                    {(review.images?.length || 0) + (review.videos?.length || 0) > 0 && (
                                        <div className="flex flex-wrap gap-3">
                                            {review.images?.map((img, idx) => (
                                                <button
                                                    key={`img-${idx}`}
                                                    onClick={() => handleMediaClick(img)}
                                                    className="relative h-16 w-16 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden group cursor-pointer hover:border-black dark:hover:border-white transition-all shadow-sm focus:outline-none"
                                                >
                                                    <img src={img} alt="review" className="h-full w-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                                        <ExternalLink size={14} className="text-white opacity-0 group-hover:opacity-100" />
                                                    </div>
                                                </button>
                                            ))}
                                            {review.videos?.map((vid, idx) => (
                                                <button
                                                    key={`vid-${idx}`}
                                                    onClick={() => handleMediaClick(vid)}
                                                    className="relative h-16 w-16 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center group cursor-pointer hover:border-black dark:hover:border-white transition-all shadow-sm focus:outline-none"
                                                >
                                                    <Film size={20} className="text-zinc-400 group-hover:text-black dark:group-hover:text-white" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                                        <ExternalLink size={14} className="text-white opacity-0 group-hover:opacity-100" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <MediaViewer
                isOpen={viewerState.isOpen}
                onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
                media={viewerState.media}
                mediaType={viewerState.type}
            />
        </div>
    );
}
