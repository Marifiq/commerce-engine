'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
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
}

export default function ProductCard({ id, name, price, image, category }: ProductCardProps) {
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
                    <h3 className="text-sm text-zinc-700 dark:text-zinc-200">
                        <Link href={`/product/${id}`} className="cursor-pointer">
                            <span aria-hidden="true" className="absolute" />
                            {name}
                        </Link>
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{category}</p>
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">${price}</p>
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
