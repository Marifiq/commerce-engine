'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Star } from 'lucide-react';

import { useDispatch } from 'react-redux';
import { addItemToCart } from '../../redux/features/cartSlice';
import { AppDispatch } from '../../redux/store';
import { resolveImageUrl } from '../../utils/imageUtils';

interface ProductCardProps {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    averageRating?: number;
    reviewCount?: number;
}


export default function ProductCard({ id, name, price, image, category, averageRating, reviewCount }: ProductCardProps) {

    const dispatch = useDispatch<AppDispatch>();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(addItemToCart({ productId: id, quantity: 1 }));
    };

    return (
        <div className="group relative">
            <Link href={`/product/${id}`} className="block cursor-pointer">
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-zinc-200 xl:aspect-h-8 xl:aspect-w-7 relative">
                    <img
                        src={resolveImageUrl(image)}
                        alt={name}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                </div>

            </Link>

            <div className="mt-4 flex justify-between">
                <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                        <Link href={`/product/${id}`} className="cursor-pointer">
                            <span aria-hidden="true" className="absolute" />
                            {name}
                        </Link>
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{category}</p>
                        {(averageRating !== undefined && reviewCount !== undefined) && (
                            <>
                                <span className="text-zinc-300 dark:text-zinc-700 mx-1">•</span>
                                <div className="flex items-center gap-1">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={10}
                                                className={`${i < Math.floor(averageRating) ? 'fill-black text-black dark:fill-white dark:text-white' : 'text-zinc-200 dark:text-zinc-700'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-500">{averageRating} ({reviewCount})</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <p className="text-sm font-black text-zinc-900 dark:text-white">${price}</p>
            </div>

            <div className="mt-4">
                <button
                    onClick={handleAddToCart}
                    className="relative z-20 flex w-full items-center justify-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all cursor-pointer"
                >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Add to Cart
                </button>
            </div>
        </div>
    );
}
