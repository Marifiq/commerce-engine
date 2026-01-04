'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Edit2, ChevronDown, Search, ArrowUpDown } from 'lucide-react';
import { apiFetch } from '@/lib/utils/api';
import { useToast } from '@/contexts';
import { Product, Category } from '@/types';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import { LoadingSpinner } from '@/components/ui';

type SortOption = 'name-asc' | 'name-desc' | 'category-asc' | 'category-desc' | 'price-asc' | 'price-desc' | 'none';

interface OrderItem {
    id?: number;
    productId: number;
    quantity: number;
    price: number;
    product?: Product;
}

interface EditOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    order: {
        id: number;
        items: OrderItem[];
        shippingAddress: string;
        paymentMethod: string;
        totalAmount: number;
        status: string;
    };
}

export function EditOrderModal({ isOpen, onClose, onUpdate, order }: EditOrderModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(true);
    const [shippingAddress, setShippingAddress] = useState(order.shippingAddress || '');
    const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod || 'card');
    const [items, setItems] = useState<OrderItem[]>([]);
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
    const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});
    const [selectedCategories, setSelectedCategories] = useState<{ [key: number]: string }>({});
    const [sortOptions, setSortOptions] = useState<{ [key: number]: SortOption }>({});
    const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setShippingAddress(order.shippingAddress || '');
            setPaymentMethod(order.paymentMethod || 'card');
            setItems(order.items.map(item => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                product: item.product
            })));
            setOpenDropdownIndex(null);
            setSearchTerms({});
            setSelectedCategories({});
            setSortOptions({});
            fetchProducts();
            fetchCategories();
        }
    }, [isOpen, order]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdownIndex !== null) {
                const dropdown = dropdownRefs.current[openDropdownIndex];
                if (dropdown && !dropdown.contains(event.target as Node)) {
                    setOpenDropdownIndex(null);
                }
            }
        };

        if (openDropdownIndex !== null) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [openDropdownIndex]);

    const fetchProducts = async () => {
        try {
            setProductsLoading(true);
            const res = await apiFetch('/products');
            const fetchedProducts = res.data.data || [];
            setProducts(fetchedProducts);
            
            // Populate product info for items that might be missing it
            setItems(prevItems => prevItems.map(item => {
                if (!item.product && fetchedProducts.length > 0) {
                    const product = fetchedProducts.find(p => p.id === item.productId);
                    return { ...item, product };
                }
                return item;
            }));
        } catch (error) {
            console.error('Failed to fetch products:', error);
            showToast('Failed to load products', 'error');
        } finally {
            setProductsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await apiFetch('/categories');
            setCategories(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleAddItem = () => {
        if (products.length > 0) {
            const firstProduct = products[0];
            setItems([...items, {
                productId: firstProduct.id,
                quantity: 1,
                price: firstProduct.price,
                product: firstProduct
            }]);
        }
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: 'productId' | 'quantity' | 'price', value: any) => {
        const newItems = [...items];
        if (field === 'productId') {
            const product = products.find(p => p.id === parseInt(value));
            if (product) {
                newItems[index] = {
                    ...newItems[index],
                    productId: product.id,
                    price: product.price,
                    product: product
                };
            }
        } else if (field === 'quantity') {
            newItems[index] = {
                ...newItems[index],
                quantity: Math.max(1, parseInt(value) || 1)
            };
        } else if (field === 'price') {
            newItems[index] = {
                ...newItems[index],
                price: Math.max(0, parseFloat(value) || 0)
            };
        }
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (items.length === 0) {
            showToast('Order must have at least one item', 'error');
            return;
        }

        if (!shippingAddress.trim()) {
            showToast('Shipping address is required', 'error');
            return;
        }

        setLoading(true);
        try {
            const totalAmount = calculateTotal();
            const orderItems = items.map(item => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            }));

            await apiFetch(`/admin/orders/${order.id}`, {
                method: 'PUT',
                body: {
                    items: orderItems,
                    shippingAddress,
                    paymentMethod,
                    totalAmount
                }
            });

            showToast('Order updated successfully', 'success');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Failed to update order:', error);
            showToast(error.message || 'Failed to update order', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in fade-in duration-200 border border-zinc-200 dark:border-zinc-800 flex flex-col">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
                        Edit Order #{order.id}
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Shipping Address */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Shipping Address *
                        </label>
                        <textarea
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none resize-none"
                            placeholder="Enter complete shipping address..."
                            required
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                            Payment Method *
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none cursor-pointer"
                            required
                        >
                            <option value="card">Credit/Debit Card</option>
                            <option value="paypal">PayPal</option>
                            <option value="cash">Cash on Delivery</option>
                            <option value="bank">Bank Transfer</option>
                        </select>
                    </div>

                    {/* Order Items */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                Order Items *
                            </label>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-xs font-bold uppercase tracking-widest cursor-pointer"
                            >
                                <Plus size={14} />
                                Add Item
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                                No items in order. Click "Add Item" to add products.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, index) => {
                                    const selectedProduct = products.find(p => p.id === item.productId);
                                    return (
                                        <div key={index} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                                <div className="md:col-span-5">
                                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-widest">
                                                        Product
                                                    </label>
                                                    {productsLoading ? (
                                                        <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm text-zinc-500">Loading...</div>
                                                    ) : (
                                                        <div 
                                                            ref={(el) => { dropdownRefs.current[index] = el; }}
                                                            className="relative w-full"
                                                        >
                                                            {/* Selected Product Display */}
                                                            <button
                                                                type="button"
                                                                onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
                                                                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none cursor-pointer text-sm font-medium flex items-center gap-3 min-h-[42px]"
                                                            >
                                                                {selectedProduct ? (
                                                                    <>
                                                                        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                                                                            <img 
                                                                                src={resolveImageUrl(selectedProduct.image)} 
                                                                                alt={selectedProduct.name} 
                                                                                className="h-full w-full object-cover" 
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1 text-left min-w-0">
                                                                            <div className="font-medium text-zinc-900 dark:text-white truncate">
                                                                                {selectedProduct.name} | ${selectedProduct.price.toFixed(2)} | Stock: {selectedProduct.stock || 0}
                                                                            </div>
                                                                            {selectedProduct.category && (
                                                                                <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                                                                    {selectedProduct.category}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-zinc-500">Select product...</span>
                                                                )}
                                                                <ChevronDown 
                                                                    size={16} 
                                                                    className={`text-zinc-400 shrink-0 transition-transform ${openDropdownIndex === index ? 'rotate-180' : ''}`} 
                                                                />
                                                            </button>

                                                            {/* Dropdown Menu */}
                                                            {openDropdownIndex === index && (
                                                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl max-h-[500px] overflow-hidden flex flex-col">
                                                                    {/* Search */}
                                                                    <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
                                                                        <div className="relative mb-2">
                                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Search products..."
                                                                                value={searchTerms[index] || ''}
                                                                                onChange={(e) => setSearchTerms({ ...searchTerms, [index]: e.target.value })}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                                                                            />
                                                                        </div>
                                                                        
                                                                        {/* Filters */}
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {/* Category Filter */}
                                                                            <div>
                                                                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-widest">
                                                                                    Category
                                                                                </label>
                                                                                <select
                                                                                    value={selectedCategories[index] || 'all'}
                                                                                    onChange={(e) => setSelectedCategories({ ...selectedCategories, [index]: e.target.value })}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none cursor-pointer"
                                                                                >
                                                                                    <option value="all">All Categories</option>
                                                                                    {categories.map(category => (
                                                                                        <option key={category.id} value={category.name}>
                                                                                            {category.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>

                                                                            {/* Sort */}
                                                                            <div>
                                                                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-widest">
                                                                                    Sort
                                                                                </label>
                                                                                <div className="relative">
                                                                                    <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" size={12} />
                                                                                    <select
                                                                                        value={sortOptions[index] || 'none'}
                                                                                        onChange={(e) => setSortOptions({ ...sortOptions, [index]: e.target.value as SortOption })}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none cursor-pointer"
                                                                                    >
                                                                                        <option value="none">No Sort</option>
                                                                                        <option value="name-asc">Name (A-Z)</option>
                                                                                        <option value="name-desc">Name (Z-A)</option>
                                                                                        <option value="category-asc">Category (A-Z)</option>
                                                                                        <option value="category-desc">Category (Z-A)</option>
                                                                                        <option value="price-asc">Price (Low to High)</option>
                                                                                        <option value="price-desc">Price (High to Low)</option>
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Product List */}
                                                                    <div className="overflow-y-auto max-h-64">
                                                                        {(() => {
                                                                            // Filter: only in stock products (but include currently selected product even if out of stock)
                                                                            let filtered = products.filter(product => 
                                                                                (product.stock || 0) > 0 || product.id === item.productId
                                                                            );

                                                                            // Filter: by category
                                                                            const selectedCategory = selectedCategories[index] || 'all';
                                                                            if (selectedCategory !== 'all') {
                                                                                filtered = filtered.filter(product => product.category === selectedCategory);
                                                                            }

                                                                            // Filter: by search term
                                                                            const searchTerm = (searchTerms[index] || '').toLowerCase();
                                                                            if (searchTerm) {
                                                                                filtered = filtered.filter(product => 
                                                                                    product.name.toLowerCase().includes(searchTerm) ||
                                                                                    product.category?.toLowerCase().includes(searchTerm)
                                                                                );
                                                                            }

                                                                            // Sort
                                                                            const sortBy = sortOptions[index] || 'none';
                                                                            if (sortBy !== 'none') {
                                                                                filtered = [...filtered].sort((a, b) => {
                                                                                    switch (sortBy) {
                                                                                        case 'name-asc':
                                                                                            return a.name.localeCompare(b.name);
                                                                                        case 'name-desc':
                                                                                            return b.name.localeCompare(a.name);
                                                                                        case 'category-asc':
                                                                                            return (a.category || '').localeCompare(b.category || '');
                                                                                        case 'category-desc':
                                                                                            return (b.category || '').localeCompare(a.category || '');
                                                                                        case 'price-asc':
                                                                                            return a.price - b.price;
                                                                                        case 'price-desc':
                                                                                            return b.price - a.price;
                                                                                        default:
                                                                                            return 0;
                                                                                    }
                                                                                });
                                                                            }

                                                                            return filtered;
                                                                        })().map(product => (
                                                                                <div
                                                                                    key={product.id}
                                                                                    onClick={() => {
                                                                                        handleItemChange(index, 'productId', product.id);
                                                                                        setOpenDropdownIndex(null);
                                                                                        setSearchTerms({ ...searchTerms, [index]: '' });
                                                                                    }}
                                                                                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                                                                                        item.productId === product.id
                                                                                            ? 'bg-zinc-100 dark:bg-zinc-800'
                                                                                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                                                                    }`}
                                                                                >
                                                                                    <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                                                                                        <img 
                                                                                            src={resolveImageUrl(product.image)} 
                                                                                            alt={product.name} 
                                                                                            className="h-full w-full object-cover" 
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="font-medium text-zinc-900 dark:text-white truncate text-sm">
                                                                                            {product.name}
                                                                                        </div>
                                                                                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                                                                            {product.category || 'N/A'}
                                                                                        </div>
                                                                                        <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                                                                                            ${product.price.toFixed(2)} • Stock: {product.stock || 0}
                                                                                        </div>
                                                                                    </div>
                                                                                    {item.productId === product.id && (
                                                                                        <div className="h-2 w-2 rounded-full bg-black dark:bg-white shrink-0"></div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        {(() => {
                                                                            // Use same filtering logic for empty state
                                                                            let filtered = products.filter(product => 
                                                                                (product.stock || 0) > 0 || product.id === item.productId
                                                                            );
                                                                            const selectedCategory = selectedCategories[index] || 'all';
                                                                            if (selectedCategory !== 'all') {
                                                                                filtered = filtered.filter(product => product.category === selectedCategory);
                                                                            }
                                                                            const searchTerm = (searchTerms[index] || '').toLowerCase();
                                                                            if (searchTerm) {
                                                                                filtered = filtered.filter(product => 
                                                                                    product.name.toLowerCase().includes(searchTerm) ||
                                                                                    product.category?.toLowerCase().includes(searchTerm)
                                                                                );
                                                                            }
                                                                            return filtered.length === 0;
                                                                        })() && (
                                                                            <div className="p-4 text-center text-sm text-zinc-500">
                                                                                No products in stock found
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-widest">
                                                        Quantity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none text-sm"
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-widest">
                                                        Price
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.price}
                                                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none text-sm"
                                                    />
                                                </div>
                                                <div className="md:col-span-1 flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="w-full p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all cursor-pointer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                                                Subtotal: ${(item.price * item.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Total Amount</span>
                            <span className="text-2xl font-black text-zinc-900 dark:text-white">${calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-3 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 text-zinc-500 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || items.length === 0}
                            className="flex-1 px-4 py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-black/5 cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <LoadingSpinner size="small" />}
                            <Edit2 size={14} />
                            Update Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

