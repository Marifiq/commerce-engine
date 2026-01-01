'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Star } from 'lucide-react';

import { useDispatch } from 'react-redux';
import { addItemToCart } from '../../redux/features/cartSlice';
import { AppDispatch } from '../../redux/store';
import { resolveImageUrl } from '../../utils/imageUtils';
import { useToast } from './ToastContext';

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
}


export default function ProductCard({ id, name, price, originalPrice, discountedPrice, discountPercent, hasDiscount, image, category, averageRating, reviewCount }: ProductCardProps) {

    const dispatch = useDispatch<AppDispatch>();
    const { showToast } = useToast();

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await dispatch(addItemToCart({ productId: id, quantity: 1 })).unwrap();
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

    return (
        <div className="group relative h-full flex flex-col">
            <Link href={`/product/${id}`} className="block cursor-pointer flex-shrink-0">
                <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    {showDiscount && (
                        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                            {Math.round(discountPercent || 0)}% OFF
                        </div>
                    )}
                    <img
                        src={resolveImageUrl(image)}
                        alt={name}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-all duration-300" />
                </div>
            </Link>

            <div className="mt-4 flex justify-between items-start flex-shrink-0">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                        <Link href={`/product/${id}`} className="cursor-pointer hover:underline">
                            {name}
                        </Link>
                    </h3>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{category}</p>
                        {(averageRating !== undefined && reviewCount !== undefined) && (
                            <>
                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                <div className="flex items-center gap-1">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={10}
                                                className={`${i < Math.floor(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200 dark:text-zinc-700'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{averageRating} ({reviewCount})</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="ml-2 flex-shrink-0 text-right">
                    {showDiscount && originalPrice ? (
                        <div className="flex flex-col items-end">
                            <p className="text-sm font-black text-zinc-900 dark:text-white">${displayPrice.toFixed(2)}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-600 line-through">${originalPrice.toFixed(2)}</p>
                        </div>
                    ) : (
                        <p className="text-sm font-black text-zinc-900 dark:text-white">${displayPrice.toFixed(2)}</p>
                    )}
                </div>
            </div>

            <div className="mt-4 flex-shrink-0">
                <button
                    onClick={handleAddToCart}
                    className="relative z-20 flex w-full items-center justify-center rounded-lg border-2 border-black dark:border-white bg-black dark:bg-white px-4 py-2.5 text-sm font-black uppercase tracking-wider text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm"
                >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Add to Cart
                </button>
            </div>
        </div>
    );
}
