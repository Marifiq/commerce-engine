'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Image as ImageIcon, Tag, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/utils/api';
import { Product, Category } from '@/types';
import { useToast } from '@/contexts';
import { Modal } from '@/components/ui';
import { useOffers, useOfferForm } from '@/features/admin/pages/OffersPage/hooks';
import { OffersList } from '@/features/admin/pages/OffersPage/components/OffersList';
import { OfferForm } from '@/features/admin/pages/OffersPage/components/OfferForm';
import { BannerBuilder } from '@/components/admin';
import { resolveImageUrl } from '@/lib/utils/imageUtils';

interface Banner {
  id: number;
  title?: string;
  description?: string;
  image?: string;
  link?: string;
  position: string;
  isActive: boolean;
  order: number;
  config?: any;
}

export default function OffersPage() {
  const [activeTab, setActiveTab] = useState<'offers' | 'banners'>('offers');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    offerId: number | null;
  }>({
    isOpen: false,
    offerId: null,
  });

  // Banner state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerDeleteModal, setBannerDeleteModal] = useState<{
    isOpen: boolean;
    bannerId: number | null;
  }>({
    isOpen: false,
    bannerId: null,
  });

  const { showToast } = useToast();
  const { offers, loading, refetch } = useOffers();
  const {
    formData,
    setFormData,
    selectedProductIds,
    setSelectedProductIds,
    editingOffer,
    initializeForm,
    resetForm,
  } = useOfferForm();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (activeTab === 'banners') {
      fetchBanners();
    }
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      const res = await apiFetch('/products');
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
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

  const fetchBanners = async () => {
    try {
      setBannersLoading(true);
      const res = await apiFetch('/admin/banners');
      setBanners(res.data.banners || []);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      showToast('Failed to load banners', 'error');
    } finally {
      setBannersLoading(false);
    }
  };

  const handleSaveBanner = async (data: {
    title?: string;
    description?: string;
    image?: string;
    link?: string;
    position: string;
    isActive: boolean;
    order: number;
    config?: any;
  }) => {
    try {
      setSubmitting(true);
      let imageData = data.image;
      
      // Convert base64 to URL if needed
      if (imageData && imageData.startsWith('data:image')) {
        // For now, we'll send the base64 string - backend should handle it
        imageData = imageData;
      }

      const payload: any = {
        title: data.title || null,
        description: data.description || null,
        image: imageData,
        link: data.link || null,
        position: data.position,
        isActive: data.isActive,
        order: data.order,
        config: data.config || null,
      };

      if (editingBanner) {
        await apiFetch(`/admin/banners/${editingBanner.id}`, {
          method: 'PUT',
          body: payload,
        });
        showToast('Banner updated successfully', 'success');
      } else {
        await apiFetch('/admin/banners', {
          method: 'POST',
          body: payload,
        });
        showToast('Banner created successfully', 'success');
      }
      
      setEditingBanner(null);
      fetchBanners();
    } catch (error: unknown) {
      console.error('Failed to save banner:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error saving banner';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBanner = async () => {
    const bannerId = bannerDeleteModal.bannerId;
    if (!bannerId) return;

    setBannerDeleteModal({ isOpen: false, bannerId: null });
    setSubmitting(true);
    try {
      await apiFetch(`/admin/banners/${bannerId}`, { method: 'DELETE' });
      showToast('Banner deleted successfully', 'success');
      fetchBanners();
    } catch (error: unknown) {
      console.error('Failed to delete banner:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error deleting banner';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenModal = (offer: any = null) => {
    initializeForm(offer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        discountPercent: formData.discountPercent,
        targetType: formData.targetType,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        isActive: Boolean(formData.isActive),
        showBanner: Boolean(formData.showBanner),
      };

      if (formData.targetType === 'product') {
        if (selectedProductIds.length > 0) {
          payload.productIds = selectedProductIds;
        } else {
          showToast('Please select at least one product', 'error');
          setSubmitting(false);
          return;
        }
      } else if (formData.targetType === 'category') {
        payload.targetId = formData.targetId;
        payload.targetName = formData.targetName || null;
      }

      if (editingOffer) {
        await apiFetch(`/offers/${editingOffer.id}`, {
          method: 'PATCH',
          body: payload,
        });
        showToast('Offer updated successfully', 'success');
      } else {
        await apiFetch('/offers', {
          method: 'POST',
          body: payload,
        });
        showToast('Offer created successfully', 'success');
      }
      handleCloseModal();
      refetch();
      fetchProducts();
      fetchCategories();
    } catch (error: unknown) {
      console.error('Failed to save offer:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error saving offer';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (offerId: number) => {
    setDeleteModal({ isOpen: true, offerId });
  };

  const handleConfirmDelete = async () => {
    const offerId = deleteModal.offerId;
    if (!offerId) return;

    setDeleteModal({ isOpen: false, offerId: null });
    setSubmitting(true);
    try {
      await apiFetch(`/offers/${offerId}`, { method: 'DELETE' });
      showToast('Offer deleted successfully', 'success');
      refetch();
      fetchProducts();
      fetchCategories();
    } catch (error: unknown) {
      console.error('Failed to delete offer:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error deleting offer';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTargetTypeChange = (targetType: string) => {
    setFormData({
      ...formData,
      targetType: targetType as 'all' | 'product' | 'category',
      targetId: null,
      targetName: '',
    });
    if (targetType !== 'product') {
      setSelectedProductIds([]);
    }
  };

  const handleTargetSelect = (targetId: number, targetName: string) => {
    setFormData({
      ...formData,
      targetId,
      targetName,
    });
  };

  const handleProductToggle = (productId: number) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">
            Offers & Banners
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Create and manage special offers, discounts, and custom banners
          </p>
        </div>
        {activeTab === 'offers' && (
          <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg"
          >
            <Plus size={18} />
            Create Offer
          </button>
        )}
        {activeTab === 'banners' && (
          <button
            onClick={() => setEditingBanner(null)}
            className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg"
          >
            <Plus size={18} />
            Create Banner
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-2 px-4 py-2 font-bold transition-colors ${
            activeTab === 'offers'
              ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Tag size={18} />
          <span>Offers</span>
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-4 py-2 font-bold transition-colors ${
            activeTab === 'banners'
              ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <ImageIcon size={18} />
          <span>Banners</span>
        </button>
      </div>

      {/* Offers Tab */}
      {activeTab === 'offers' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search offers..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Offers Table */}
          <OffersList
            offers={offers}
            loading={loading}
            searchTerm={searchTerm}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onEdit={handleOpenModal}
            onDelete={handleDeleteClick}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <>
          {editingBanner || (!editingBanner && banners.length === 0) ? (
            <BannerBuilder
              banner={editingBanner || undefined}
              onSave={handleSaveBanner}
              onCancel={() => setEditingBanner(null)}
              saving={submitting}
            />
          ) : (
            <>
              {/* Banners List */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6 text-black dark:text-white">All Banners</h2>
                {bannersLoading ? (
                  <div className="text-center py-12 text-zinc-500">Loading banners...</div>
                ) : banners.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    No banners yet. Create your first banner to get started!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {banners.map((banner) => (
                      <div
                        key={banner.id}
                        className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {banner.image && (
                          <img
                            src={resolveImageUrl(banner.image)}
                            alt={banner.title || 'Banner'}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">
                            {banner.title || 'Untitled Banner'}
                          </h3>
                          {banner.description && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-2">
                              {banner.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                              {banner.position}
                            </span>
                            <span className={`px-2 py-1 rounded ${
                              banner.isActive 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            }`}>
                              {banner.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingBanner(banner)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                              <ImageIcon size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => setBannerDeleteModal({ isOpen: true, bannerId: banner.id })}
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <OfferForm
        isOpen={isModalOpen}
        editingOffer={editingOffer}
        formData={formData}
        products={products}
        categories={categories}
        selectedProductIds={selectedProductIds}
        submitting={submitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onFieldChange={(field, value) => setFormData({ ...formData, [field]: value })}
        onTargetTypeChange={handleTargetTypeChange}
        onTargetSelect={handleTargetSelect}
        onProductToggle={handleProductToggle}
        onRemoveProduct={handleRemoveProduct}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, offerId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Offer"
        message="Are you sure you want to delete this offer? This action cannot be undone and will remove the discount from the associated product/category."
        confirmText="Delete Offer"
        type="danger"
      />

      {/* Banner Delete Confirmation Modal */}
      <Modal
        isOpen={bannerDeleteModal.isOpen}
        onClose={() => setBannerDeleteModal({ isOpen: false, bannerId: null })}
        onConfirm={handleDeleteBanner}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        confirmText="Delete Banner"
        type="danger"
      />
    </div>
  );
}
