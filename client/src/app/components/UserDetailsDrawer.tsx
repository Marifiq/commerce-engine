'use client';

import React, { useState } from 'react';
import {
    X,
    User,
    Mail,
    Calendar,
    ShoppingBag,
    ShoppingCart,
    Star,
    ExternalLink,
    CheckCircle,
    Clock,
    AlertCircle,
    Plus,
    Trash2,
    Package
} from 'lucide-react';
import { AddToCartModal } from './AddToCartModal';
import { CreateOrderModal } from './CreateOrderModal';

interface UserDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    data: any | null;
    loading: boolean;
    onAddToCart?: (productId: number, quantity: number) => Promise<void>;
    onRemoveFromCart?: (itemId: number) => Promise<void>;
    onCreateOrder?: (orderData: any) => Promise<void>;
    onRefresh?: () => Promise<void>;
}

const statusColors: Record<string, string> = {
    pending: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400',
    shipped: 'bg-zinc-800 text-white dark:bg-white dark:text-black',
    delivered: 'bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white',
    cancelled: 'bg-white text-zinc-400 border-2 border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800',
};

export function UserDetailsDrawer({ isOpen, onClose, data, loading, onAddToCart, onRemoveFromCart, onCreateOrder, onRefresh }: UserDetailsDrawerProps) {
    const [showAddToCart, setShowAddToCart] = useState(false);
    const [showCreateOrder, setShowCreateOrder] = useState(false);
    const [removingItemId, setRemovingItemId] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleRemoveItem = async (itemId: number) => {
        if (!onRemoveFromCart) return;
        setRemovingItemId(itemId);
        try {
            await onRemoveFromCart(itemId);
            if (onRefresh) await onRefresh();
        } finally {
            setRemovingItemId(null);
        }
    };

    const cartTotal = data?.cart?.items?.reduce((sum: number, item: any) =>
        sum + (item.product?.price * item.quantity), 0
    ) || 0;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <div
                className="absolute inset-0 bg-transparent"
                onClick={onClose}
            />
            <div className="bg-white dark:bg-zinc-900 h-full w-full sm:max-w-xl shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-800 relative">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">User Intelligence</h2>
                        <p className="text-sm text-zinc-500">Customer Behavior & History</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 flex flex-col items-center justify-center h-[calc(100vh-100px)]">
                        <div className="h-12 w-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-black dark:border-t-white rounded-full animate-spin" />
                        <p className="mt-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Loading Profile...</p>
                    </div>
                ) : data ? (
                    <div className="p-8 space-y-10 pb-20">
                        {/* Profile Summary */}
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-3xl text-zinc-400">
                                {data.user.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{data.user.name}</h3>
                                <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <Mail size={14} /> {data.user.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <Calendar size={14} /> Member since {new Date(data.user.id).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total Spent</p>
                                <p className="text-2xl font-black text-zinc-900 dark:text-white">${data.metrics.totalSpent}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Orders</p>
                                <p className="text-2xl font-black text-zinc-900 dark:text-white">{data.metrics.totalOrders}</p>
                            </div>
                        </div>

                        {/* Order History */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <ShoppingBag size={18} className="text-zinc-400" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Order History</h4>
                            </div>
                            <div className="space-y-3">
                                {data.orders.length > 0 ? data.orders.map((order: any) => (
                                    <div key={order.id} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group hover:border-black dark:hover:border-white transition-all">
                                        <div>
                                            <p className="font-bold text-zinc-900 dark:text-white text-sm">Order #{order.id.toString().slice(-6)}</p>
                                            <p className="text-[10px] text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-black text-zinc-900 dark:text-white text-sm">${order.total}</p>
                                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${statusColors[order.status.toLowerCase()]}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                                        <p className="text-xs font-bold text-zinc-400 italic">No orders found.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Active Cart */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <ShoppingCart size={18} className="text-zinc-400" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Current Cart</h4>
                                {data.cart.items.length > 0 && (
                                    <span className="ml-auto px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-black">
                                        {data.cart.items.length} ITEMS
                                    </span>
                                )}
                            </div>

                            {/* Cart Action Buttons */}
                            <div className="flex gap-2 mb-4">
                                {onAddToCart && (
                                    <button
                                        onClick={() => setShowAddToCart(true)}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        Add Product
                                    </button>
                                )}
                                {onCreateOrder && data.cart.items.length > 0 && (
                                    <button
                                        onClick={() => setShowCreateOrder(true)}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Package size={14} />
                                        Create Order
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {data.cart.items.length > 0 ? data.cart.items.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 group">
                                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
                                            <img src={item.product?.image} className="h-full w-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">{item.product?.name}</p>
                                            <p className="text-[10px] text-zinc-500">Qty: {item.quantity} × ${item.product?.price}</p>
                                        </div>
                                        <p className="font-black text-zinc-900 dark:text-white text-sm">${item.quantity * item.product?.price}</p>
                                        {onRemoveFromCart && (
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                disabled={removingItemId === item.id}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-600 transition-all cursor-pointer disabled:opacity-50"
                                                title="Remove item"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )) : (
                                    <div className="p-8 text-center rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                                        <p className="text-xs font-bold text-zinc-400 italic">Empty cart.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Reviews */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Star size={18} className="text-zinc-400" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Reviews Provided</h4>
                            </div>
                            <div className="space-y-4">
                                {data.reviews.length > 0 ? data.reviews.map((review: any) => (
                                    <div key={review.id} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={10}
                                                        className={i < review.rating ? "fill-black text-black dark:fill-white dark:text-white" : "text-zinc-100 dark:text-zinc-800"}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">SKU: {review.productId}</span>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
                                            "{review.text}"
                                        </p>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                                        <p className="text-xs font-bold text-zinc-400 italic">No reviews yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="p-20 text-center">
                        <AlertCircle size={40} className="mx-auto text-zinc-200 mb-4" />
                        <p className="text-sm font-bold text-zinc-400">Failed to load user intelligence.</p>
                    </div>
                )}

                {/* Modals */}
                {onAddToCart && data && (
                    <AddToCartModal
                        isOpen={showAddToCart}
                        onClose={() => setShowAddToCart(false)}
                        onAdd={onAddToCart}
                        userId={data.user.id}
                    />
                )}
                {onCreateOrder && data && (
                    <CreateOrderModal
                        isOpen={showCreateOrder}
                        onClose={() => setShowCreateOrder(false)}
                        onCreate={onCreateOrder}
                        cartTotal={cartTotal}
                        itemCount={data.cart.items.length}
                    />
                )}
            </div>
        </div>
    );
}
