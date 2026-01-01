'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { productService } from '../../../services/productService';
import { apiFetch } from '../../../utils/api';
import { Product } from '../../../types';
import Link from 'next/link';
import ProductCard from '../../components/ProductCard';
import { Filter, Search, Loader2, SlidersHorizontal, ChevronRight, X } from 'lucide-react';

export default function ShopPage() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category') || '';

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [activeCategory, sortBy]);

    const fetchCategories = async () => {
        try {
            const res = await apiFetch('/categories');
            setCategories(res.data.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let query = activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : '';
            const data = await productService.getAllProducts(query);
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAndSortedProducts = products
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            switch (sortBy) {
                case 'price-low': return a.price - b.price;
                case 'price-high': return b.price - a.price;
                case 'newest': return b.id - a.id;
                default: return 0;
            }
        });

    return (
        <div className="min-h-screen bg-white dark:bg-black pt-24 pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Hero / Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
                            <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">Home</Link>
                            <ChevronRight size={12} />
                            <span className="text-black dark:text-white">Shop</span>
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-black dark:text-white">
                            {activeCategory || 'All Products'}
                        </h1>
                        <p className="text-zinc-500 font-medium max-w-lg">
                            Discover our premium collection of high-quality apparel and accessories.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`p-3 rounded-2xl border transition-all md:hidden ${isFilterOpen ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}
                        >
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-8 relative">
                    {/* Sidebar Filters - Desktop */}
                    <aside className="hidden md:block w-64 flex-shrink-0 space-y-12 sticky top-28 self-start">
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center gap-2">
                                <Filter size={14} /> Categories
                            </h3>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setActiveCategory('')}
                                    className={`text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeCategory === '' ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'}`}
                                >
                                    All Products
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeCategory === cat ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                                Sort By
                            </h3>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-bold cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <main className="flex-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
                                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Fetching items...</p>
                            </div>
                        ) : filteredAndSortedProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                                {filteredAndSortedProducts.map((product) => (
                                    <ProductCard key={product.id} {...product} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                <div className="p-6 bg-white dark:bg-black rounded-3xl shadow-xl mb-6">
                                    <Search size={48} className="text-zinc-200" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">No products found</h3>
                                <p className="text-zinc-500 font-medium">Try adjusting your filters or search terms</p>
                                <button
                                    onClick={() => { setActiveCategory(''); setSearchTerm(''); }}
                                    className="mt-8 px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            <div className={`fixed inset-0 z-[100] transition-all duration-500 md:hidden ${isFilterOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsFilterOpen(false)}
                />
                <div className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[40px] p-8 shadow-2xl transition-transform duration-500 ${isFilterOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Filters</h2>
                        <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Categories</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => { setActiveCategory(''); setIsFilterOpen(false); }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${activeCategory === '' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                                >
                                    All
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => { setActiveCategory(cat); setIsFilterOpen(false); }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Sort By</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'newest', label: 'Newest First' },
                                    { id: 'price-low', label: 'Price: Low to High' },
                                    { id: 'price-high', label: 'Price: High to Low' }
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => { setSortBy(option.id); setIsFilterOpen(false); }}
                                        className={`text-left px-6 py-4 rounded-2xl font-bold transition-all ${sortBy === option.id ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white' : 'text-zinc-500'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
