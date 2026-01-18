'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiFetch } from '@/lib/utils/api';
import { useToast } from '@/contexts';
import { Modal } from '@/components/ui';
import { UserDetailsDrawer, EditUserModal } from '@/components/admin';
import { useUsers, UserData } from '@/features/admin/pages/UsersPage/hooks';
import { UsersList } from '@/features/admin/pages/UsersPage/components/UsersList';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    userId: string | number;
    newRole: 'admin' | 'user';
  }>({
    isOpen: false,
    userId: '',
    newRole: 'user',
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userId: string | number | null;
  }>({
    isOpen: false,
    userId: null,
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    user: UserData | null;
  }>({
    isOpen: false,
    user: null,
  });

  const { showToast } = useToast();
  const router = useRouter();
  const { users, loading, refetch } = useUsers(showArchived);
  const ITEMS_PER_PAGE = 10;

  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('id');

  useEffect(() => {
    if (!loading && users.length > 0) {
      if (initialUserId) {
        const user = users.find((u) => u.id.toString() === initialUserId);
        if (user) {
          handleViewProfile(user.id);
        }
      } else {
        setDrawerOpen(false);
        setSelectedUserId(null);
        setUserDetails(null);
      }
    }
  }, [users, initialUserId, loading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, showArchived]);

  const handleOpenConfirm = (userId: string | number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setModalConfig({
      isOpen: true,
      userId,
      newRole,
    });
  };

  const handleConfirmRoleChange = async () => {
    const { userId, newRole } = modalConfig;
    setUpdatingId(userId);
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: { role: newRole },
      });
      await refetch();
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
      userId,
    });
  };

  const handleConfirmDelete = async () => {
    const userId = deleteModal.userId;
    if (!userId) return;

    setDeleteModal({ isOpen: false, userId: null });
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      showToast('User deleted successfully', 'success');
      await refetch();
      if (selectedUserId === userId) {
        setDrawerOpen(false);
        setSelectedUserId(null);
        setUserDetails(null);
      }
    } catch (error: unknown) {
      console.error('Failed to delete user:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete user';
      showToast(errorMessage, 'error');
    }
  };

  const handleEditClick = (user: UserData) => {
    setEditModal({
      isOpen: true,
      user,
    });
  };

  const handleSaveUser = async (data: { name: string }) => {
    const userId = editModal.user?.id;
    if (!userId) return;

    try {
      await apiFetch(`/admin/users/${userId}/profile`, {
        method: 'PATCH',
        body: data,
      });
      showToast('User profile updated successfully', 'success');
      await refetch();
      if (selectedUserId === userId) {
        await handleViewProfile(userId);
      }
      setEditModal({ isOpen: false, user: null });
    } catch (error: unknown) {
      console.error('Failed to update user:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update user';
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  const handleAddToCart = async (productId: number, quantity: number) => {
    if (!selectedUserId) return;
    try {
      await apiFetch(`/admin/users/${selectedUserId}/cart/items`, {
        method: 'POST',
        body: { productId, quantity },
      });
      showToast('Product added to cart', 'success');
      await handleViewProfile(selectedUserId);
    } catch (error: unknown) {
      console.error('Failed to add to cart:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to add product';
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  const handleRemoveFromCart = async (itemId: number) => {
    if (!selectedUserId) return;
    try {
      await apiFetch(`/admin/users/${selectedUserId}/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      showToast('Item removed from cart', 'success');
    } catch (error: unknown) {
      console.error('Failed to remove item:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to remove item';
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  const handleCreateOrder = async (orderData: any) => {
    if (!selectedUserId) return;
    try {
      await apiFetch(`/admin/users/${selectedUserId}/orders`, {
        method: 'POST',
        body: orderData,
      });
      showToast('Order created successfully', 'success');
      await handleViewProfile(selectedUserId);
    } catch (error: unknown) {
      console.error('Failed to create order:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create order';
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  const handleMessageUser = async (userId: string | number) => {
    try {
      // Check if conversation already exists with this user
      const { createConversation } = await import('@/services/message.service');
      const user = users.find((u) => u.id.toString() === userId.toString());
      
      // Create a support conversation with the user
      const response = await createConversation({
        type: 'support',
        title: `Support: ${user?.name || 'User'}`,
        participantIds: [Number(userId)],
      });
      
      // Navigate to messages page with the conversation
      router.push(`/admin/messages?conversation=${response.conversation.id}`);
    } catch (error: unknown) {
      console.error('Failed to create conversation:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start conversation';
      showToast(errorMessage, 'error');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await apiFetch(`/admin/users/${id}/archive`, { method: 'PATCH' });
      showToast('User archived successfully', 'success');
      await refetch();
    } catch (error) {
      console.error('Failed to archive user:', error);
      showToast('Failed to archive user', 'error');
    }
  };

  const handleUnarchive = async (id: number) => {
    try {
      await apiFetch(`/admin/users/${id}/unarchive`, { method: 'PATCH' });
      showToast('User unarchived successfully', 'success');
      await refetch();
    } catch (error) {
      console.error('Failed to unarchive user:', error);
      showToast('Failed to unarchive user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
          Users
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Manage permissions and accounts.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all focus-within:border-black dark:focus-within:border-white flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            size={20}
          />
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
          className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-0 transition-all text-zinc-900 dark:text-white outline-none cursor-pointer text-sm font-medium"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="role-admin">Admins First</option>
          <option value="role-user">Users First</option>
        </select>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
          <input
            type="checkbox"
            id="showArchived"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-black dark:text-white focus:ring-0 cursor-pointer"
          />
          <label htmlFor="showArchived" className="text-sm font-bold text-zinc-900 dark:text-white cursor-pointer whitespace-nowrap">
            Show Archived
          </label>
        </div>
      </div>

      {/* Users Table */}
      <UsersList
        users={users}
        loading={loading}
        searchTerm={searchTerm}
        sortBy={sortBy}
        currentPage={currentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        updatingId={updatingId}
        showArchived={showArchived}
        onViewProfile={handleViewProfile}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onRoleChange={handleOpenConfirm}
        onPageChange={setCurrentPage}
        onMessage={handleMessageUser}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />

      {/* Role Change Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
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
        onRefresh={() =>
          selectedUserId ? handleViewProfile(selectedUserId) : Promise.resolve()
        }
        onMessage={handleMessageUser}
      />
    </div>
  );
}
