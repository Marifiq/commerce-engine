'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Search, Plus } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    image: string;
}

interface AddToCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (productId: number, quantity: number) => Promise<void>;
    userId: string | number;
}

export function AddToCartModal({ isOpen, onClose, onAdd, userId }: AddToCartModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/products');
            setProducts(res.data.data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProduct) return;

        setSubmitting(true);
        try {
            await onAdd(selectedProduct.id, quantity);
            onClose();
            // Reset state
            setSelectedProduct(null);
            setQuantity(1);
            setSearchTerm('');
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in fade-in duration-200 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
                        Add to Cart
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Product List */}
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="animate-spin text-black dark:text-white" size={32} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => setSelectedProduct(product)}
                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedProduct?.id === product.id
                                        ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-800'
                                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-zinc-900 dark:text-white truncate">{product.name}</h3>
                                            <p className="text-sm text-zinc-500">{product.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-zinc-900 dark:text-white">${product.price}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <p className="text-center text-zinc-500 py-8">No products found</p>
                            )}
                        </div>
                    )}

                    {/* Quantity Selector */}
                    {selectedProduct && (
                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                Quantity
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 text-zinc-500 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedProduct || submitting}
                        className="flex-1 px-4 py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-black/5 cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 className="animate-spin text-white dark:text-black" size={14} />}
                        <Plus size={14} />
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
