'use client';
import { useSearchParams, useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../utils/api';
import {
    Search,
    Users,
    Shield,
    ShieldAlert,
    Loader2,
    Mail,
    User,
    Eye,
    Edit2,
    Trash2
} from 'lucide-react';

interface UserData {
    id: number | string;
    name: string;
    email: string;
    role: 'admin' | 'user';
}

import { useToast } from '@/app/components/ToastContext';
import { Modal } from '@/app/components/Modal';
import { UserDetailsDrawer } from '@/app/components/UserDetailsDrawer';
import { EditUserModal } from '@/app/components/EditUserModal';
import { Pagination } from '@/app/components/Pagination';

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<string | number | null>(null);
    const { showToast } = useToast();
    const router = useRouter();

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        userId: string | number;
        newRole: 'admin' | 'user';
    }>({
        isOpen: false,
        userId: '',
        newRole: 'user'
    });

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Delete modal state
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        userId: string | number | null;
    }>({
        isOpen: false,
        userId: null
    });

    // Edit modal state
    const [editModal, setEditModal] = useState<{
        isOpen: boolean;
        user: UserData | null;
    }>({
        isOpen: false,
        user: null
    });

    const [sortBy, setSortBy] = useState<string>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const searchParams = useSearchParams();
    const initialUserId = searchParams.get('id');

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (!loading && users.length > 0) {
            if (initialUserId) {
                const user = users.find(u => u.id.toString() === initialUserId);
                if (user) {
                    handleViewProfile(user.id);
                }
            } else {
                // If no ID in URL, ensure drawer is closed
                setDrawerOpen(false);
                setSelectedUserId(null);
                setUserDetails(null);
            }
        }
    }, [users, initialUserId, loading]);

    // ... (fetchUsers and handlers remain here) ...

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return Number(b.id) - Number(a.id);
            case 'oldest':
                return Number(a.id) - Number(b.id);
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'role-admin':
                // Admins first
                return a.role === b.role ? 0 : a.role === 'admin' ? -1 : 1;
            case 'role-user':
                // Users first
                return a.role === b.role ? 0 : a.role === 'user' ? -1 : 1;
            default:
                return 0;
        }
    });

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const fetchUsers = async () => {
        try {
            const res = await apiFetch('/admin/users');
            setUsers(res.data.users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenConfirm = (userId: string | number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        setModalConfig({
            isOpen: true,
            userId,
            newRole
        });
    };

    const handleConfirmRoleChange = async () => {
        const { userId, newRole } = modalConfig;
        setUpdatingId(userId);
        setModalConfig(prev => ({ ...prev, isOpen: false }));

        try {
            await apiFetch(`/admin/users/${userId}`, {
                method: 'PATCH',
                body: { role: newRole }
            });
            await fetchUsers();
            showToast(`User role updated to ${newRole.toUpperCase()}`, 'success');
        } catch (error) {
            console.error('Failed to update user role:', error);
            showToast('Failed to update user role', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleViewProfile = async (userId: string | number) => {
        setSelectedUserId(userId);
        setDrawerOpen(true);
        setLoadingDetails(true);
        try {
            const res = await apiFetch(`/admin/users/${userId}/details`);
            setUserDetails(res.data);
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            showToast('Failed to load user details', 'error');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDeleteClick = (userId: string | number) => {
        setDeleteModal({
            isOpen: true,
            userId
        });
    };

    const handleConfirmDelete = async () => {
        const userId = deleteModal.userId;
        if (!userId) return;

        setDeleteModal({ isOpen: false, userId: null });
        try {
            await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
            showToast('User deleted successfully', 'success');
            await fetchUsers();
            // Close drawer if the deleted user was being viewed
            if (selectedUserId === userId) {
                setDrawerOpen(false);
                setSelectedUserId(null);
                setUserDetails(null);
            }
        } catch (error: any) {
            console.error('Failed to delete user:', error);
            showToast(error?.message || 'Failed to delete user', 'error');
        }
    };

    const handleEditClick = (user: UserData) => {
        setEditModal({
            isOpen: true,
            user
        });
    };

    const handleSaveUser = async (data: { name: string }) => {
        const userId = editModal.user?.id;
        if (!userId) return;

        try {
            await apiFetch(`/admin/users/${userId}/profile`, {
                method: 'PATCH',
                body: data
            });
            showToast('User profile updated successfully', 'success');
            await fetchUsers();
            // Refresh drawer if viewing this user
            if (selectedUserId === userId) {
                await handleViewProfile(userId);
            }
            setEditModal({ isOpen: false, user: null });
        } catch (error: any) {
            console.error('Failed to update user:', error);
            showToast(error?.message || 'Failed to update user', 'error');
            throw error;
        }
    };

    const handleAddToCart = async (productId: number, quantity: number) => {
        if (!selectedUserId) return;
        try {
            await apiFetch(`/admin/users/${selectedUserId}/cart/items`, {
                method: 'POST',
                body: { productId, quantity }
            });
            showToast('Product added to cart', 'success');
            await handleViewProfile(selectedUserId);
        } catch (error: any) {
            console.error('Failed to add to cart:', error);
            showToast(error?.message || 'Failed to add product', 'error');
            throw error;
        }
    };

    const handleRemoveFromCart = async (itemId: number) => {
        if (!selectedUserId) return;
        try {
            await apiFetch(`/admin/users/${selectedUserId}/cart/items/${itemId}`, {
                method: 'DELETE'
            });
            showToast('Item removed from cart', 'success');
        } catch (error: any) {
            console.error('Failed to remove item:', error);
            showToast(error?.message || 'Failed to remove item', 'error');
            throw error;
        }
    };

    const handleCreateOrder = async (orderData: any) => {
        if (!selectedUserId) return;
        try {
            await apiFetch(`/admin/users/${selectedUserId}/orders`, {
                method: 'POST',
                body: orderData
            });
            showToast('Order created successfully', 'success');
            await handleViewProfile(selectedUserId);
        } catch (error: any) {
            console.error('Failed to create order:', error);
            showToast(error?.message || 'Failed to create order', 'error');
            throw error;
        }
    };



    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Users</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage permissions and accounts.</p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all focus-within:border-black dark:focus-within:border-white flex flex-col sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users..."
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
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="role-admin">Admins First</option>
                    <option value="role-user">Users First</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">User</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hidden sm:table-cell">Contact</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Role</th>
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
                            ) : paginatedUsers.length > 0 ? paginatedUsers.map((item) => (
                                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                                                {item.name.charAt(0)}
                                            </div>
                                            <div className="font-bold text-zinc-900 dark:text-white">
                                                {item.name}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                                            <Mail size={14} />
                                            {item.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${item.role === 'admin'
                                            ? 'bg-black text-white dark:bg-white dark:text-black'
                                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                            }`}>
                                            {item.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                            {item.role.toUpperCase()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right min-w-[280px]">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleViewProfile(item.id)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                title="View Profile"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                title="Edit User"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(item.id)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                title="Delete User"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenConfirm(item.id, item.role)}
                                                disabled={updatingId === item.id}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${item.role === 'admin'
                                                    ? 'text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                    : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-lg shadow-black/5'
                                                    } disabled:opacity-50`}
                                            >
                                                {updatingId === item.id ? (
                                                    <Loader2 className="animate-spin" size={14} />
                                                ) : (
                                                    item.role === 'admin' ? <ShieldAlert size={14} /> : <Shield size={14} />
                                                )}
                                                <span className="hidden lg:inline">{item.role === 'admin' ? 'Revoke' : 'Make Admin'}</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        No users found matching your search.
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

            {/* Role Change Modal */}
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmRoleChange}
                title="Change User Role"
                message={`Are you sure you want to change this user's role to ${modalConfig.newRole.toUpperCase()}? This will modify their access permissions.`}
                confirmText={`Make ${modalConfig.newRole.toUpperCase()}`}
                type={modalConfig.newRole === 'admin' ? 'info' : 'danger'}
            />

            {/* Delete User Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, userId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user account and all associated data."
                confirmText="Delete User"
                type="danger"
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, user: null })}
                onSave={handleSaveUser}
                user={editModal.user}
            />

            {/* User Details Drawer */}
            <UserDetailsDrawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedUserId(null);
                    setUserDetails(null);
                    router.push('/admin/users');
                }}
                data={userDetails}
                loading={loadingDetails}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onCreateOrder={handleCreateOrder}
                onRefresh={() => selectedUserId ? handleViewProfile(selectedUserId) : Promise.resolve()}
            />
        </div>
    );
}
