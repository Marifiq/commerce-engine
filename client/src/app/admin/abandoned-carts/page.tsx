'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/utils/api';
import {
    ShoppingCart,
    User as UserIcon,
    Mail,
    Search,
    ChevronRight,
    Package,
    ArrowLeft,
    Eye,
    Send,
    Trash2
} from 'lucide-react';
import { useToast } from '@/contexts';
import { Pagination, Modal } from '@/components/ui';
import { Skeleton, LoadingSpinner } from '@/components/ui';
import { resolveImageUrl } from '@/lib/utils/imageUtils';

interface CartItem {
    id: number;
    productId: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: number;
        image: string;
    };
}

interface Cart {
    userId: number;
    items: CartItem[];
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
}

export default function AbandonedCartsPage() {
    const [carts, setCarts] = useState<Cart[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
    const [sortBy, setSortBy] = useState<string>('name-asc');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const { showToast } = useToast();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        userId: number | null;
        userName: string;
    }>({
        isOpen: false,
        userId: null,
        userName: ''
    });

    useEffect(() => {
        fetchCarts();
    }, []);

    const fetchCarts = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/admin/carts');
            setCarts(res.data.carts);
        } catch (error) {
            console.error('Error fetching carts:', error);
            showToast('Failed to fetch abandoned carts', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return price % 1 === 0 ? price.toString() : price.toFixed(2);
    };

    const calculateTotal = (items: CartItem[]) => {
        return items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    };

    const [sendingEmail, setSendingEmail] = useState<number | null>(null);

    const handleEmailUser = async (userId: number) => {
        setSendingEmail(userId);
        try {
            await apiFetch(`/admin/carts/${userId}/send-email`, { method: 'POST' });
            showToast('Abandoned cart email sent successfully!', 'success');
        } catch (error) {
            console.error('Failed to send email:', error);
            showToast('Failed to send email', 'error');
        } finally {
            setSendingEmail(null);
        }
    };

    const handleDeleteClick = (userId: number, userName: string) => {
        setDeleteModal({
            isOpen: true,
            userId,
            userName
        });
    };

    const handleConfirmDelete = async () => {
        const userId = deleteModal.userId;
        if (!userId) return;

        setDeleteModal(prev => ({ ...prev, isOpen: false }));
        setDeletingId(userId);
        try {
            await apiFetch(`/admin/users/${userId}/cart`, { method: 'DELETE' });
            showToast('Cart deleted successfully', 'success');
            await fetchCarts();
            // If the deleted cart was selected, clear the selection
            if (selectedCart?.userId === userId) {
                setSelectedCart(null);
            }
        } catch (error) {
            console.error('Failed to delete cart:', error);
            showToast('Failed to delete cart', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredAndSortedCarts = carts
        .filter(cart =>
            cart.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cart.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const totalA = calculateTotal(a.items);
            const totalB = calculateTotal(b.items);
            const itemsA = a.items.length;
            const itemsB = b.items.length;
            const nameA = a.user?.name || '';
            const nameB = b.user?.name || '';

            switch (sortBy) {
                case 'name-asc': return nameA.localeCompare(nameB);
                case 'name-desc': return nameB.localeCompare(nameA);
                case 'total-high': return totalB - totalA;
                case 'total-low': return totalA - totalB;
                case 'items-high': return itemsB - itemsA;
                case 'items-low': return itemsA - itemsB;
                default: return 0;
            }
        });

    const totalPages = Math.ceil(filteredAndSortedCarts.length / ITEMS_PER_PAGE);
    const paginatedCarts = filteredAndSortedCarts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);


    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">
                        Abandoned Carts
                    </h1>
                    <p className="text-zinc-500 font-medium font-sans">Monitor active carts that haven't checkout yet</p>
                </div>

                {!selectedCart && (
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full sm:w-auto px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all font-bold cursor-pointer"
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="total-high">Value (High-Low)</option>
                            <option value="total-low">Value (Low-High)</option>
                            <option value="items-high">Items (Most)</option>
                            <option value="items-low">Items (Least)</option>
                        </select>
                    </div>
                )}
            </div>

            {selectedCart ? (
                /* Detailed View */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSelectedCart(null)}
                            className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold group cursor-pointer"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Items
                        </button>

                        {selectedCart.user && (
                            <button
                                onClick={() => handleEmailUser(selectedCart.user!.id)}
                                disabled={sendingEmail === selectedCart.user.id}
                                className="flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={14} />
                                {sendingEmail === selectedCart.user.id ? 'Sending...' : 'Email Customer'}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* User Summary */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                                    <ShoppingCart size={80} />
                                </div>
                                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-fit relative z-10">
                                    <UserIcon size={32} className="text-black dark:text-white" />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">
                                        {selectedCart.user?.name || 'Unknown User'}
                                    </h2>
                                    <p className="text-zinc-500 flex items-center gap-2 font-medium">
                                        <Mail size={14} />
                                        {selectedCart.user?.email || 'No email'}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 relative z-10">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Cart Status</p>
                                    <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white rounded-full text-xs font-black uppercase tracking-wider">
                                        In Progress
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 bg-black dark:bg-white rounded-3xl text-white dark:text-black shadow-xl shadow-black/10">
                                <p className="text-sm font-bold opacity-70 uppercase tracking-wider mb-2">Total Value</p>
                                <p className="text-4xl font-black tracking-tighter">
                                    ${formatPrice(calculateTotal(selectedCart.items))}
                                </p>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-lg font-black uppercase tracking-tight text-black dark:text-white flex items-center gap-2">
                                <Package size={20} />
                                Cart Items ({selectedCart.items.length})
                            </h3>
                            <div className="grid gap-4">
                                {selectedCart.items.map((item) => (
                                    <div key={item.id} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 hover:border-black dark:hover:border-white transition-all cursor-default group">
                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                                            <img
                                                src={resolveImageUrl(item.product.image)}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-black dark:text-white uppercase tracking-tight truncate group-hover:translate-x-1 transition-transform">
                                                {item.product.name}
                                            </h4>
                                            <p className="text-zinc-500 text-sm font-black opacity-80 uppercase tracking-widest mt-1">
                                                Qty: {item.quantity} × ${item.product.price}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-black dark:text-white text-lg">
                                                ${formatPrice(item.quantity * item.product.price)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Updated Table View */
                <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">User</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hidden sm:table-cell">Contact</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Items</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Total Value</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, index) => (
                                            <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <Skeleton variant="circular" className="h-10 w-10" />
                                                        <Skeleton className="h-5 w-32" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 hidden sm:table-cell">
                                                    <Skeleton className="h-4 w-40" />
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <Skeleton className="h-5 w-8 mx-auto" />
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <Skeleton className="h-5 w-16 ml-auto" />
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : paginatedCarts.length > 0 ? (
                                        paginatedCarts.map((cart, index) => (
                                            <tr
                                                key={index}
                                                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group cursor-pointer"
                                                onClick={() => setSelectedCart(cart)}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-black dark:text-white uppercase transition-all group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black group-hover:scale-110">
                                                            {(cart.user?.name || 'U').charAt(0)}
                                                        </div>
                                                        <div className="font-black text-black dark:text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                                                            {cart.user?.name || 'Unknown User'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 hidden sm:table-cell">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                                                        <Mail size={14} className="text-zinc-400" />
                                                        {cart.user?.email || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex items-center px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                                                        {cart.items.length} {cart.items.length === 1 ? 'Item' : 'Items'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="font-black text-black dark:text-white tracking-tighter text-lg">
                                                        ${formatPrice(calculateTotal(cart.items))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedCart(cart)}
                                                            className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        {cart.user && (
                                                            <button
                                                                onClick={() => handleEmailUser(cart.user!.id)}
                                                                disabled={sendingEmail === cart.user.id}
                                                                className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title="Email Customer"
                                                            >
                                                                {sendingEmail === cart.user.id ? (
                                                                    <LoadingSpinner size="small" />
                                                                ) : (
                                                                    <Send size={18} />
                                                                )}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteClick(cart.userId, cart.user?.name || 'Unknown User')}
                                                            disabled={deletingId === cart.userId}
                                                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer rounded-lg"
                                                            title="Delete Cart"
                                                        >
                                                            {deletingId === cart.userId ? <LoadingSpinner size="small" /> : <Trash2 size={18} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <ShoppingCart size={48} className="text-zinc-200 dark:text-zinc-800" />
                                                    <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-xs">No matching carts found</p>
                                                </div>
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
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: '' })}
                onConfirm={handleConfirmDelete}
                title="Delete Cart"
                message={`Are you sure you want to delete the cart for ${deleteModal.userName}? This action will permanently remove all items from the cart.`}
                confirmText="Delete Cart"
                type="danger"
            />
        </div>
    );
}
