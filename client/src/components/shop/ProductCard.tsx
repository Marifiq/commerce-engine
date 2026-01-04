'use client';

import { useRef, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingBag, Star, ArrowRight, ImageIcon } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useRedux';
import { addItemToCart } from '@/store/features/cart';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import { useToast } from '@/contexts';
import { usePrefetchProduct } from '@/hooks/queries/useProducts';

interface ProductCardProps {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    discountedPrice?: number;
    discountPercent?: number;
    hasDiscount?: boolean;
    image: string;
    category: string;
    averageRating?: number;
    reviewCount?: number;
    sizeEnabled?: boolean;
    stock?: number;
    sizes?: Array<{ size: string; stock: number }>;
}


function ProductCard({ id, name, price, originalPrice, discountedPrice, discountPercent, hasDiscount, image, category, averageRating, reviewCount, sizeEnabled, stock, sizes }: ProductCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const prefetchProduct = usePrefetchProduct();
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    // Check if product is out of stock
    const isOutOfStock = () => {
        if (sizeEnabled && sizes) {
            // For size-enabled products, check if all sizes are out of stock
            return sizes.length === 0 || sizes.every(size => size.stock <= 0);
        } else {
            // For non-size products, check the main stock field
            return (stock ?? 0) <= 0;
        }
    };

    const outOfStock = isOutOfStock();

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if product is out of stock
        if (outOfStock) {
            showToast('This product is currently out of stock', 'error');
            return;
        }
        
        // Check if product has sizes - if so, navigate to product page to select size
        const hasSizes = sizeEnabled && sizes && sizes.length > 0;
        if (hasSizes) {
            router.push(`/product/${id}`);
            return;
        }
        
        // Product has no sizes and is in stock - add directly to cart
        try {
            await dispatch(addItemToCart({
                product: { id, name, price, image, category } as any,
                quantity: 1
            })).unwrap();
            showToast('Product added to cart', 'success');
        } catch (error: unknown) {
            // Redux thunk rejectWithValue returns the payload directly (string in our case)
            const errorMessage = typeof error === 'string' ? error : error instanceof Error ? error.message : 'Failed to add product to cart';
            showToast(errorMessage, 'error');
        }
    };

    // Use discounted price if available, otherwise use regular price
    const displayPrice = discountedPrice || price;
    const showDiscount = hasDiscount && discountPercent && discountPercent > 0;
    
    // Check if image exists and is valid
    const hasValidImage = image && image.trim() !== '';

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on the button area
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[data-no-navigate]')) {
            return;
        }
        
        // Always navigate to product page when clicking on the card
        // (users can still view product details even if out of stock)
        router.push(`/product/${id}`);
    };

    return (
        <div 
            ref={cardRef} 
            onClick={handleCardClick}
            onMouseEnter={() => prefetchProduct(id)}
            onFocus={() => prefetchProduct(id)}
            className="product-card group relative h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5 cursor-pointer"
        >
            <div className="block cursor-pointer flex-shrink-0 relative overflow-hidden">
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                    {showDiscount && (
                        <div className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-xl backdrop-blur-sm animate-pulse">
                            {Math.round(discountPercent || 0)}% OFF
                        </div>
                    )}
                    {outOfStock && (
                        <div className="absolute top-4 left-4 z-20 px-4 py-2 bg-gradient-to-r from-zinc-700 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-xl backdrop-blur-sm border-2 border-white/20">
                            OUT OF STOCK
                        </div>
                    )}
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {hasValidImage && !imageError ? (
                        <>
                            {imageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 animate-pulse z-0">
                                    <div className="w-12 h-12 border-4 border-zinc-300 dark:border-zinc-600 border-t-black dark:border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                            <Image
                                src={resolveImageUrl(image)}
                                alt={name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className={`object-cover object-center transition-all duration-700 group-hover:scale-110 group-hover:brightness-105 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                onError={() => {
                                    setImageError(true);
                                    setImageLoading(false);
                                }}
                                onLoad={() => setImageLoading(false)}
                                loading="lazy"
                            />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                            <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-500">
                                <ImageIcon size={48} className="opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Quick view indicator - only show when in stock */}
                    {!outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                            <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">View Product</span>
                                <ArrowRight size={14} className="text-black dark:text-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3 flex-shrink-0">
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-2">
                            {name}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                                {category}
                            </span>
                            {(averageRating !== undefined && reviewCount !== undefined) && (
                                <div className="flex items-center gap-1.5">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={11}
                                                className={`${i < Math.floor(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{averageRating.toFixed(1)}</span>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">({reviewCount})</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                        {showDiscount && originalPrice ? (
                            <div className="flex flex-col items-end">
                                <p className="text-lg font-black text-zinc-900 dark:text-white">${displayPrice.toFixed(2)}</p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-600 line-through font-medium">${originalPrice.toFixed(2)}</p>
                            </div>
                        ) : (
                            <p className="text-lg font-black text-zinc-900 dark:text-white">${displayPrice.toFixed(2)}</p>
                        )}
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800" data-no-navigate>
                    <button
                        onClick={handleAddToCart}
                        data-no-navigate
                        disabled={outOfStock}
                        className={`group/btn relative w-full overflow-hidden rounded-xl px-5 py-3.5 text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                            outOfStock
                                ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-60'
                                : 'bg-gradient-to-r from-black to-zinc-900 dark:from-white dark:to-zinc-100 text-white dark:text-black hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <ShoppingBag className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" />
                            <span>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                        </span>
                        {!outOfStock && (
                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-black dark:from-zinc-200 dark:to-white opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Memoize component to prevent unnecessary re-renders
export default memo(ProductCard);
