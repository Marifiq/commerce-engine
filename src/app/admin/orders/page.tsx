'use client';
import { useSearchParams, useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../utils/api';
import {
    Search,
    Eye,
    Package,
    Truck,
    CheckCircle,
    Clock,
    X,
    Loader2,
    ChevronDown
} from 'lucide-react';

interface Order {
    id: number | string;
    userId: number;
    userName?: string;
    email?: string;
    items: any[];
    total: number;
    status: string;
    createdAt: string;
    shippingAddress: string;
    paymentMethod: string;
}

const statusColors: Record<string, string> = {
    pending: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400',
    shipped: 'bg-zinc-800 text-white dark:bg-white dark:text-black',
    delivered: 'bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white',
    cancelled: 'bg-white text-zinc-400 border-2 border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800',
};

import { useToast } from '@/app/components/ToastContext';
import { Pagination } from '@/app/components/Pagination';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updatingId, setUpdatingId] = useState<string | number | null>(null);
    const { showToast } = useToast();
    const router = useRouter();

    const [sortBy, setSortBy] = useState<string>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;


    const searchParams = useSearchParams();
    const initialOrderId = searchParams.get('id');

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (!loading && orders.length > 0) {
            if (initialOrderId) {
                const order = orders.find(o => o.id.toString() === initialOrderId);
                if (order) {
                    setSelectedOrder(order);
                }
            } else {
                setSelectedOrder(null);
            }
        }
    }, [orders, initialOrderId, loading]);

    const fetchOrders = async () => {
        try {
            const res = await apiFetch('/admin/orders');
            setOrders(res.data.orders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            showToast('Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string | number, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            await apiFetch(`/admin/orders/${orderId}`, {
                method: 'PATCH',
                body: { status: newStatus }
            });
            await fetchOrders();
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
            }
            showToast(`Order status updated to ${newStatus.toUpperCase()}`, 'success');
        } catch (error) {
            console.error('Failed to update status:', error);
            showToast('Failed to update order status', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);

    const filteredOrders = orders.filter(o =>
        o.id.toString().includes(searchTerm) ||
        o.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.shippingAddress.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'oldest':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'total-high':
                return b.total - a.total;
            case 'total-low':
                return a.total - b.total;
            case 'status':
                return a.status.localeCompare(b.status);
            default:
                return 0;
        }
    });

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Orders</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage customer fulfillment and track status.</p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all focus-within:border-black dark:focus-within:border-white flex flex-col sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-0 transition-all text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="mt-4 sm:mt-0 sm:ml-4 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-0 transition-all text-zinc-900 dark:text-white outline-none cursor-pointer text-sm font-medium"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="total-high">Price: High to Low</option>
                    <option value="total-low">Price: Low to High</option>
                    <option value="status">Status (A-Z)</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin mx-auto text-black dark:text-white" size={32} />
                                    </td>
                                </tr>
                            ) : paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                                        #{order.id.toString().slice(-6)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                                        ${order.total}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative inline-block">
                                            {updatingId === order.id ? (
                                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                                    <Loader2 className="animate-spin text-black dark:text-white" size={14} /> Updating...
                                                </div>
                                            ) : (
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateStatus(order.id, e.target.value);
                                                    }}
                                                    className={`appearance-none px-4 py-1.5 pr-8 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer border-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all ${statusColors[order.status.toLowerCase()] || 'bg-zinc-100'}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right min-w-[100px]">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOrder(order);
                                            }}
                                            className="p-2 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No orders found matching your search.
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

            {/* Order Details Drawer/Modal */}
            {
                selectedOrder && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-end bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-zinc-900 h-full w-full sm:max-w-xl shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-800">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Order Details</h2>
                                    <p className="text-sm text-zinc-500">Order #{selectedOrder.id}</p>
                                </div>
                                <button onClick={() => {
                                    setSelectedOrder(null);
                                    router.push('/admin/orders');
                                }} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Summary Section */}
                                <div className="flex items-center justify-between">
                                    <div className={`px-4 py-2 rounded-2xl font-bold text-sm ${statusColors[selectedOrder.status.toLowerCase()]}`}>
                                        {selectedOrder.status.toUpperCase()}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-zinc-500">Total Amount</div>
                                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">${selectedOrder.total}</div>
                                    </div>
                                </div>

                                {/* Customer & Address */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Customer Information</h3>
                                        <div className="space-y-1">
                                            <p className="font-bold text-zinc-900 dark:text-white">User ID: {selectedOrder.userId}</p>
                                            <p className="text-sm text-zinc-500">Payment: {selectedOrder.paymentMethod}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Shipping Address</h3>
                                        <p className="text-sm text-zinc-900 dark:text-zinc-300 leading-relaxed">
                                            {selectedOrder.shippingAddress}
                                        </p>
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Order Items</h3>
                                    <div className="space-y-4">
                                        {selectedOrder.items.map((item: any) => (
                                            <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                                                <div className="h-16 w-16 rounded-xl bg-white dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                                                    <img src={item.product?.image || '/images/placeholder.jpg'} alt={item.product?.name} className="h-full w-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-zinc-900 dark:text-white">{item.product?.name}</div>
                                                    <div className="text-sm text-zinc-500">Qty: {item.quantity} × ${item.product?.price}</div>
                                                </div>
                                                <div className="font-bold text-zinc-900 dark:text-white">
                                                    ${item.quantity * (item.product?.price || 0)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                                        disabled={selectedOrder.status === 'shipped' || updatingId !== null}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <Truck size={20} /> Mark as Shipped
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                                        disabled={selectedOrder.status === 'delivered' || updatingId !== null}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-black/5"
                                    >
                                        <CheckCircle size={20} /> Mark as Delivered
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
