'use client';

import { X, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectIsCartOpen,
    selectCartItems,
    selectCartTotal,
    toggleCart,
    removeItemFromCart,
    updateCartItemQuantity,
    toggleCheckout,
    fetchCart
} from '../../redux/features/cartSlice';
import { AppDispatch, RootState } from '../../redux/store';
import { useEffect } from 'react';
import { resolveImageUrl } from '../../utils/imageUtils';

export default function CartSidebar() {
    const dispatch = useDispatch<AppDispatch>();
    const isOpen = useSelector(selectIsCartOpen);
    const items = useSelector(selectCartItems);
    const total = useSelector(selectCartTotal);
    const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

    useEffect(() => {
        if (isAuthenticated && isOpen) {
            dispatch(fetchCart());
        }
    }, [isAuthenticated, isOpen, dispatch]);

    const handleClose = () => dispatch(toggleCart());
    const handleCheckout = () => dispatch(toggleCheckout());


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
                    {items.length === 0 ? (
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
                                {items.map((item) => (
                                    <li key={item.id} className="flex py-6">
                                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
                                            <img
                                                src={resolveImageUrl(item.image)}
                                                alt={item.name}
                                                className="h-full w-full object-cover object-center p-2"
                                            />
                                        </div>

                                        <div className="ml-4 flex flex-1 flex-col">
                                            <div>
                                                <div className="flex justify-between text-base font-medium text-zinc-900 dark:text-white">
                                                    <h3>{item.name}</h3>
                                                    <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-1 items-end justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (item.quantity > 1) {
                                                                dispatch(updateCartItemQuantity({ cartItemId: item.id, quantity: item.quantity - 1 }));
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
                                                        onClick={() => dispatch(updateCartItemQuantity({ cartItemId: item.id, quantity: item.quantity + 1 }))}
                                                        className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
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
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {items.length > 0 && (
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
