'use client';

import { X, Minus, Plus, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
    selectIsCartOpen,
    selectCartItems,
    selectCartTotal,
    toggleCart,
    removeItemFromCart,
    updateCartItemQuantity,
    toggleCheckout,
    fetchCart
} from '@/store/features/cart';
import { RootState } from '@/store/store';
import { useEffect, useRef, useState } from 'react';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import { useToast } from '@/contexts';

export default function CartSidebar() {
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const isOpen = useSelector(selectIsCartOpen);
    const items = useSelector(selectCartItems);
    const total = useSelector(selectCartTotal);
    const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
    const previousItemsRef = useRef<typeof items>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isAuthenticated && isOpen) {
            dispatch(fetchCart());
        }
    }, [isAuthenticated, isOpen, dispatch]);

    // Show toast when items become out of stock
    useEffect(() => {
        if (previousItemsRef.current.length > 0) {
            items.forEach(item => {
                if (item.isOutOfStock) {
                    const previousItem = previousItemsRef.current.find(prev => prev.id === item.id);
                    if (!previousItem?.isOutOfStock) {
                        showToast(`${item.name}${item.size ? ` (Size: ${item.size})` : ''} is now out of stock`, 'error');
                    }
                }
            });
        }
        previousItemsRef.current = items;
    }, [items, showToast]);

    const handleClose = () => dispatch(toggleCart());
    const handleCheckout = () => dispatch(toggleCheckout());

    const handleUpdateQuantity = async (itemId: number | string, newQuantity: number, size?: string | null) => {
        try {
            await dispatch(updateCartItemQuantity({ cartItemId: itemId, quantity: newQuantity, size })).unwrap();
        } catch (error: any) {
            const errorMessage = typeof error === 'string' 
                ? error 
                : error?.message || 'Failed to update quantity';
            showToast(errorMessage, 'error');
        }
    };

    const handleSizeChange = async (itemId: number | string, newSize: string, currentQuantity: number) => {
        try {
            await dispatch(updateCartItemQuantity({ cartItemId: itemId, quantity: currentQuantity, size: newSize })).unwrap();
            showToast('Size updated', 'success');
        } catch (error: any) {
            const errorMessage = typeof error === 'string' 
                ? error 
                : error?.message || 'Failed to update size';
            showToast(errorMessage, 'error');
        }
    };


    return (
        <div
            className={`fixed inset-y-0 right-0 z-50 w-full transform bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-zinc-900 sm:max-w-md ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 py-6 sm:px-6">
                    <h2 className="text-lg font-medium text-zinc-900 dark:text-white">Shopping Cart</h2>
                    <button
                        type="button"
                        className="relative -m-2 p-2 text-zinc-400 hover:text-zinc-500"
                        onClick={handleClose}
                    >
                        <X className="h-6 w-6 cursor-pointer" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                    {!mounted || items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                            <p className="text-zinc-500 dark:text-zinc-400">Your cart is empty</p>
                            <button
                                onClick={handleClose}
                                className="text-sm font-medium text-black hover:underline dark:text-white"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="flow-root">
                            <ul role="list" className="-my-6 divide-y divide-zinc-200 dark:divide-zinc-800">
                                {items.map((item) => {
                                    // Check if image exists and is valid
                                    const imageUrl = item.image && item.image.trim() !== '' && item.image !== 'null' && item.image !== 'undefined' 
                                        ? resolveImageUrl(item.image) 
                                        : '';
                                    const hasValidImage = imageUrl && imageUrl.trim() !== '' && !imageUrl.includes('undefined') && !imageUrl.includes('null');
                                    
                                    return (
                                        <li key={item.id} className="flex py-6">
                                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center relative">
                                            {hasValidImage ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover object-center p-2"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        const parent = (e.target as HTMLImageElement).parentElement;
                                                        if (parent) {
                                                            const icon = parent.querySelector('.cart-image-icon') as HTMLElement;
                                                            if (icon) icon.style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                            <div className="cart-image-icon absolute inset-0 flex items-center justify-center" style={{ display: hasValidImage ? 'none' : 'flex' }}>
                                                <ImageIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                                            </div>
                                        </div>

                                        <div className="ml-4 flex flex-1 flex-col">
                                            <div>
                                                <div className="flex justify-between text-base font-medium text-zinc-900 dark:text-white">
                                                    <div>
                                                        <h3>{item.name}</h3>
                                                        {item.sizeEnabled && item.sizes && item.sizes.length > 0 ? (
                                                            <div className="mt-2">
                                                                <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">
                                                                    Size:
                                                                </label>
                                                                <select
                                                                    value={item.size || ''}
                                                                    onChange={(e) => handleSizeChange(item.id, e.target.value, item.quantity)}
                                                                    className="text-sm px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                                                                >
                                                                    {item.sizes.map((sizeOption) => (
                                                                        <option
                                                                            key={sizeOption.size}
                                                                            value={sizeOption.size}
                                                                            disabled={sizeOption.stock <= 0}
                                                                        >
                                                                            {sizeOption.size} {sizeOption.stock <= 0 ? '(Out of Stock)' : `(${sizeOption.stock} available)`}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : item.size ? (
                                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                                                Size: {item.size}
                                                            </p>
                                                        ) : null}
                                                        {item.isOutOfStock && (
                                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-medium">
                                                                Out of Stock
                                                            </p>
                                                        )}
                                                        {!item.isOutOfStock && item.availableStock !== undefined && item.availableStock < item.quantity && (
                                                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                                                Only {item.availableStock} available
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-1 items-end justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (item.quantity > 1) {
                                                                handleUpdateQuantity(item.id, item.quantity - 1, item.size);
                                                            } else {
                                                                dispatch(removeItemFromCart(item.id));
                                                            }
                                                        }}
                                                        className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="text-zinc-500 dark:text-zinc-400 font-medium w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (item.isOutOfStock) {
                                                                showToast('This item is out of stock', 'error');
                                                                return;
                                                            }
                                                            handleUpdateQuantity(item.id, item.quantity + 1, item.size);
                                                        }}
                                                        disabled={item.isOutOfStock}
                                                        className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => dispatch(removeItemFromCart(item.id))}
                                                    className="font-medium text-black hover:text-zinc-500 dark:text-white dark:hover:text-zinc-400 cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {mounted && items.length > 0 && (
                    <div className="border-t border-zinc-200 px-4 py-6 dark:border-zinc-800 sm:px-6">
                        <div className="flex justify-between text-base font-medium text-zinc-900 dark:text-white">
                            <p>Subtotal</p>
                            <p>${total.toFixed(2)}</p>
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                            Shipping and taxes calculated at checkout.
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={handleCheckout}
                                className="flex w-full items-center justify-center rounded-md border border-transparent bg-black px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-zinc-800 cursor-pointer dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                            >
                                Checkout
                            </button>
                        </div>
                        <div className="mt-6 flex justify-center text-center text-sm text-zinc-500 dark:text-zinc-400">
                            <p>
                                or{' '}
                                <button
                                    type="button"
                                    className="font-medium text-black hover:text-zinc-800 dark:text-white dark:hover:text-zinc-200"
                                    onClick={handleClose}
                                >
                                    Continue Shopping
                                    <span aria-hidden="true"> &rarr;</span>
                                </button>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
