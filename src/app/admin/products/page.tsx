'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../utils/api';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    Image as ImageIcon,
    CheckCircle
} from 'lucide-react';
import { Product } from '../../../types';
import { useToast } from '@/app/components/ToastContext';
import { Modal } from '@/app/components/Modal';
import { Pagination } from '@/app/components/Pagination';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    // Delete Modal state
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        productId: number | null;
    }>({
        isOpen: false,
        productId: null
    });

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        category: '',
        description: '',
        image: '/images/placeholder.jpg',
        color: '#ffffff'
    });

    // Image upload states
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Category management
    const [categoryMode, setCategoryMode] = useState<'select' | 'new'>('select');
    const [newCategoryName, setNewCategoryName] = useState('');

    // Extract unique categories from products
    const uniqueCategories = [...new Set(products.map(p => p.category))].filter(Boolean);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await apiFetch('/products');
            setProducts(res.data.data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            showToast('Failed to load products', 'error');
        } finally {
            setLoading(false);
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

    const handleOpenModal = (product: Product | null = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price,
                category: product.category,
                description: product.description || '',
                image: product.image,
                color: product.color || '#ffffff'
            });
            setImagePreview(product.image);
            setCategoryMode('select');
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                price: 0,
                category: '',
                description: '',
                image: '/images/placeholder.jpg',
                color: '#ffffff'
            });
            setImagePreview(null);
            setImageFile(null);
            setCategoryMode('select');
            setNewCategoryName('');
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size must be less than 5MB', 'error');
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                setFormData({ ...formData, image: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Handle new category
            let finalCategory = formData.category;
            if (categoryMode === 'new' && newCategoryName) {
                // First save the category
                await apiFetch('/categories', {
                    method: 'POST',
                    body: { name: newCategoryName }
                });
                finalCategory = newCategoryName;
                await fetchCategories();
            }

            const submitData = { ...formData, category: finalCategory };

            if (editingProduct) {
                await apiFetch(`/products/${editingProduct.id}`, {
                    method: 'PATCH',
                    body: submitData
                });
                showToast('Product updated successfully', 'success');
            } else {
                await apiFetch('/products', {
                    method: 'POST',
                    body: submitData
                });
                showToast('Product created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchProducts();
            fetchCategories();
        } catch (error) {
            console.error('Failed to save product:', error);
            showToast('Error saving product', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const [categoryBeingEdited, setCategoryBeingEdited] = useState<string | null>(null);
    const [editingCategoryValue, setEditingCategoryValue] = useState('');

    const handleQuickAddCategory = async () => {
        if (!newCategoryName) return;
        setSubmitting(true);
        try {
            await apiFetch('/categories', {
                method: 'POST',
                body: { name: newCategoryName }
            });
            showToast('Category added successfully', 'success');
            setNewCategoryName('');
            fetchCategories();
        } catch (error) {
            console.error('Failed to add category:', error);
            showToast('Error adding category', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditCategory = async (oldName: string) => {
        if (!editingCategoryValue || editingCategoryValue === oldName) {
            setCategoryBeingEdited(null);
            return;
        }
        setSubmitting(true);
        try {
            await apiFetch(`/categories/${oldName}`, {
                method: 'PATCH',
                body: { newName: editingCategoryValue }
            });
            showToast('Category renamed successfully', 'success');
            setCategoryBeingEdited(null);
            fetchCategories();
            fetchProducts(); // Refresh products to see updated category names
        } catch (error) {
            console.error('Failed to edit category:', error);
            showToast('Error renaming category', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCategory = async (name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? Products in this category will be uncategorized.`)) return;
        setSubmitting(true);
        try {
            await apiFetch(`/categories/${name}`, { method: 'DELETE' });
            showToast('Category deleted successfully', 'success');
            fetchCategories();
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete category:', error);
            showToast('Error deleting category', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteModal({
            isOpen: true,
            productId: id
        });
    };

    const handleConfirmDelete = async () => {
        const id = deleteModal.productId;
        if (!id) return;

        setDeleteModal(prev => ({ ...prev, isOpen: false }));
        try {
            await apiFetch(`/products/${id}`, { method: 'DELETE' });
            showToast('Product deleted successfully', 'success');
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete product:', error);
            showToast('Error deleting product', 'error');
        }
    };

    const [sortBy, setSortBy] = useState<string>('newest');

    // ... existing state ...

    // ... existing useEffect ...

    // ... existing fetch functions ...

    // ... existing handlers ...

    const filteredProducts = products
        .filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return b.id - a.id;
                case 'oldest':
                    return a.id - b.id;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                default:
                    return 0;
            }
        });

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);

    return (
        <div className="space-y-6 sm:space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Products</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage inventory and details.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all font-black uppercase tracking-widest text-xs border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    >
                        + Category
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-all font-black uppercase tracking-widest text-xs shadow-lg shadow-black/5 cursor-pointer"
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all focus-within:border-black dark:focus-within:border-white">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-0 transition-all text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-0 transition-all text-zinc-900 dark:text-white outline-none cursor-pointer text-sm font-medium"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="category">Category (A-Z)</option>
                        <option value="price-asc">Price (Low to High)</option>
                        <option value="price-desc">Price (High to Low)</option>
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Product</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Color</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Price</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin mx-auto text-black dark:text-white" size={32} />
                                    </td>
                                </tr>
                            ) : paginatedProducts.length > 0 ? paginatedProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                                ) : <ImageIcon size={20} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-zinc-900 dark:text-white">{product.name}</div>
                                                <div className="text-sm text-zinc-500 truncate max-w-[200px]">{product.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full border border-zinc-200 dark:border-zinc-800"
                                                style={{ backgroundColor: product.color || '#ffffff' }}
                                            />
                                            <span className="text-[10px] font-mono text-zinc-400 uppercase">{product.color || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                                        ${product.price}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(product)}
                                                className="p-2 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(product.id)}
                                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        No products found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white cursor-pointer outline-none"
                                        value={categoryMode === 'new' ? '__new__' : formData.category}
                                        onChange={(e) => {
                                            if (e.target.value === '__new__') {
                                                setCategoryMode('new');
                                                setFormData({ ...formData, category: '' });
                                            } else {
                                                setCategoryMode('select');
                                                setFormData({ ...formData, category: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value="__new__">+ Add New Category</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="h-10 w-12 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 cursor-pointer overflow-hidden p-0"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-mono uppercase text-sm outline-none"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    {/* Placeholder to keep alignment if needed, or we can leave it empty */}
                                </div>
                            </div>
                            {categoryMode === 'new' && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">New Category Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter category name"
                                        className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 transition-all text-zinc-900 dark:text-white"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Product Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 transition-all text-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-90 file:cursor-pointer"
                                />
                                {imagePreview && (
                                    <div className="mt-3">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-xl border border-zinc-200 dark:border-zinc-800"
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 font-medium hover:bg-zinc-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg shadow-black/5 disabled:opacity-50 cursor-pointer hover:opacity-90"
                                >
                                    {submitting && <Loader2 className="animate-spin" size={18} />}
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, productId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone and will remove the product from the store permanently."
                confirmText="Delete Product"
                type="danger"
            />

            {/* Category Management Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-zinc-200 dark:border-zinc-800">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Plus size={20} className="text-zinc-900 dark:text-white" />
                                Manage Categories
                            </h2>
                            <button onClick={() => {
                                setIsCategoryModalOpen(false);
                                setCategoryBeingEdited(null);
                            }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Add New Section */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Add New Category</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Category name..."
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 transition-all text-zinc-900 dark:text-white outline-none"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAddCategory()}
                                    />
                                    <button
                                        onClick={handleQuickAddCategory}
                                        disabled={submitting || !newCategoryName}
                                        className="p-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-zinc-900/10 dark:shadow-white/10"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* List Section */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Existing Categories</label>
                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {categories.length > 0 ? categories.map((cat) => (
                                        <div key={cat} className="group flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                                            {categoryBeingEdited === cat ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        autoFocus
                                                        className="flex-1 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-blue-500 text-sm outline-none"
                                                        value={editingCategoryValue}
                                                        onChange={(e) => setEditingCategoryValue(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleEditCategory(cat)}
                                                    />
                                                    <button
                                                        onClick={() => handleEditCategory(cat)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg transition-colors"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setCategoryBeingEdited(null)}
                                                        className="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cat}</span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setCategoryBeingEdited(cat);
                                                                setEditingCategoryValue(cat);
                                                            }}
                                                            className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all cursor-pointer"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(cat)}
                                                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all cursor-pointer"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )) : (
                                        <p className="text-center py-4 text-xs text-zinc-500 italic">No categories found.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
                            <button
                                onClick={() => {
                                    setIsCategoryModalOpen(false);
                                    setCategoryBeingEdited(null);
                                }}
                                className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
