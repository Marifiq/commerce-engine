"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "../../../utils/api";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Tag,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { Offer, Product, Category } from "../../../types";
import { useToast } from "@/app/components/ToastContext";
import { Modal } from "@/app/components/Modal";
import { Pagination } from "@/app/components/Pagination";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import Skeleton from "@/app/components/ui/Skeleton";
import { resolveImageUrl } from "../../../utils/imageUtils";

type SortOption = 'name-asc' | 'name-desc' | 'category-asc' | 'category-desc' | 'none';

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete Modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    offerId: number | null;
  }>({
    isOpen: false,
    offerId: null,
  });

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountPercent: 0,
    targetType: "all",
    targetId: null as number | null,
    targetName: "",
    startDate: "",
    endDate: "",
    isActive: true,
    showBanner: false,
  });

  // Product selection states
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("none");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOffers();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await apiFetch("/offers");
      setOffers(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch offers:", error);
      showToast("Failed to load offers", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiFetch("/products");
      setProducts(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiFetch("/categories");
      setCategories(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProductDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };

    if (isProductDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isProductDropdownOpen]);

  const handleOpenModal = (offer: Offer | null = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        title: offer.title,
        description: offer.description || "",
        discountPercent: offer.discountPercent,
        targetType: offer.targetType,
        targetId: offer.targetId || null,
        targetName: offer.targetName || "",
        startDate: offer.startDate
          ? new Date(offer.startDate).toISOString().slice(0, 16)
          : "",
        endDate: offer.endDate
          ? new Date(offer.endDate).toISOString().slice(0, 16)
          : "",
        isActive: offer.isActive,
        showBanner: offer.showBanner,
      });
      // Load selected products from offer
      if (offer.products && Array.isArray(offer.products)) {
        const productIds = offer.products.map((op: any) => 
          typeof op === 'object' && op.productId ? op.productId : op
        );
        setSelectedProductIds(productIds);
      } else {
        setSelectedProductIds([]);
      }
    } else {
      setEditingOffer(null);
      setFormData({
        title: "",
        description: "",
        discountPercent: 0,
        targetType: "all",
        targetId: null,
        targetName: "",
        startDate: "",
        endDate: "",
        isActive: true,
        showBanner: false,
      });
      setSelectedProductIds([]);
    }
    setIsProductDropdownOpen(false);
    setProductSearchTerm("");
    setSelectedCategory("all");
    setSortOption("none");
    setIsModalOpen(true);
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

      if (formData.targetType === "product") {
        if (selectedProductIds.length > 0) {
          payload.productIds = selectedProductIds;
        } else {
          showToast("Please select at least one product", "error");
          setSubmitting(false);
          return;
        }
      } else if (formData.targetType === "category") {
        payload.targetId = formData.targetId;
        payload.targetName = formData.targetName || null;
      } else {
        // "all" - no additional fields needed
      }

      if (editingOffer) {
        await apiFetch(`/offers/${editingOffer.id}`, {
          method: "PATCH",
          body: payload,
        });
        showToast("Offer updated successfully", "success");
      } else {
        await apiFetch("/offers", {
          method: "POST",
          body: payload,
        });
        showToast("Offer created successfully", "success");
      }
      setIsModalOpen(false);
      fetchOffers();
      fetchProducts();
      fetchCategories();
    } catch (error: any) {
      console.error("Failed to save offer:", error);
      showToast(error.message || "Error saving offer", "error");
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
      await apiFetch(`/offers/${offerId}`, { method: "DELETE" });
      showToast("Offer deleted successfully", "success");
      fetchOffers();
      fetchProducts();
      fetchCategories();
    } catch (error: any) {
      console.error("Failed to delete offer:", error);
      showToast(error.message || "Error deleting offer", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTargetTypeChange = (targetType: string) => {
    setFormData({
      ...formData,
      targetType,
      targetId: null,
      targetName: "",
    });
    if (targetType !== "product") {
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
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProductIds(prev => prev.filter(id => id !== productId));
  };

  // Filter and sort products for dropdown
  const getFilteredProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search term
    if (productSearchTerm) {
      const search = productSearchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search)
      );
    }

    // Sort
    if (sortOption !== "none") {
      filtered = [...filtered].sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'category-asc':
            return (a.category || '').localeCompare(b.category || '');
          case 'category-desc':
            return (b.category || '').localeCompare(a.category || '');
          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  const filteredOffers = offers.filter((offer) =>
    offer.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedOffers = filteredOffers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isOfferActive = (offer: Offer) => {
    if (!offer.isActive) return false;
    const now = new Date();
    if (offer.startDate && new Date(offer.startDate) > now) return false;
    if (offer.endDate && new Date(offer.endDate) < now) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">
            Offers Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Create and manage special offers and discounts
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg"
        >
          <Plus size={18} />
          Create Offer
        </button>
      </div>

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
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                  Discount
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                  Target
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                  Period
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedOffers.length > 0 ? (
                paginatedOffers.map((offer) => {
                  const active = isOfferActive(offer);
                  return (
                    <tr
                      key={offer.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Tag
                            size={18}
                            className="text-zinc-400 dark:text-zinc-600"
                          />
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white">
                              {offer.title}
                            </p>
                            {offer.description && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {offer.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          {offer.discountPercent}% OFF
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-zinc-900 dark:text-white capitalize">
                            {offer.targetType}
                          </p>
                          {offer.targetName && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {offer.targetName}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {offer.startDate ? (
                            <p>
                              {new Date(offer.startDate).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-zinc-400">No start</p>
                          )}
                          {offer.endDate && (
                            <p className="mt-1">
                              → {new Date(offer.endDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              active
                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {active ? "Active" : "Inactive"}
                          </span>
                          {offer.showBanner && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg animate-pulse">
                              🌟 Global Banner
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(offer)}
                            className="p-2 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(offer.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-zinc-400 dark:text-zinc-600">
                      No offers found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredOffers.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredOffers.length / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">
                {editingOffer ? "Edit Offer" : "Create Offer"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Discount % *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                    value={formData.discountPercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Target Type *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white cursor-pointer outline-none"
                    value={formData.targetType}
                    onChange={(e) => handleTargetTypeChange(e.target.value)}
                  >
                    <option value="all">All Products</option>
                    <option value="product">Specific Product</option>
                    <option value="category">Category</option>
                  </select>
                </div>
              </div>

              {formData.targetType === "product" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Select Products *
                  </label>
                  
                  {/* Selected Products Display */}
                  {selectedProductIds.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {selectedProductIds.map(productId => {
                        const product = products.find(p => p.id === productId);
                        if (!product) return null;
                        return (
                          <div
                            key={productId}
                            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800"
                          >
                            <div className="h-12 w-12 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
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
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(productId)}
                              className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Product Selection Dropdown */}
                  <div ref={dropdownRef} className="relative w-full">
                    <button
                      type="button"
                      onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none cursor-pointer text-sm font-medium flex items-center gap-3 min-h-[42px]"
                    >
                      <span className="text-zinc-500">Select products...</span>
                      <ChevronDown
                        size={16}
                        className={`text-zinc-400 shrink-0 transition-transform ml-auto ${isProductDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isProductDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl max-h-[500px] overflow-hidden flex flex-col">
                        {/* Search */}
                        <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
                          <div className="relative mb-2">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input
                              type="text"
                              placeholder="Search products..."
                              value={productSearchTerm}
                              onChange={(e) => setProductSearchTerm(e.target.value)}
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
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
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
                                  value={sortOption}
                                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none cursor-pointer"
                                >
                                  <option value="none">No Sort</option>
                                  <option value="name-asc">Name (A-Z)</option>
                                  <option value="name-desc">Name (Z-A)</option>
                                  <option value="category-asc">Category (A-Z)</option>
                                  <option value="category-desc">Category (Z-A)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Product List */}
                        <div className="overflow-y-auto max-h-64">
                          {getFilteredProducts().length > 0 ? (
                            getFilteredProducts().map(product => (
                              <div
                                key={product.id}
                                onClick={() => handleProductToggle(product.id)}
                                className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                                  selectedProductIds.includes(product.id)
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
                                {selectedProductIds.includes(product.id) && (
                                  <div className="h-2 w-2 rounded-full bg-black dark:bg-white shrink-0"></div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-zinc-500">
                              No products found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formData.targetType === "category" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Select Category *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white cursor-pointer outline-none"
                    value={formData.targetId || ""}
                    onChange={(e) => {
                      const id = parseInt(e.target.value);
                      const category = categories.find((c) => c.id === id);
                      handleTargetSelect(id, category?.name || "");
                    }}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Active
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                    checked={formData.showBanner}
                    onChange={(e) =>
                      setFormData({ ...formData, showBanner: e.target.checked })
                    }
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Show Banner
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Only one banner can be active globally
                    </span>
                  </div>
                </label>
              </div>
              
              {formData.showBanner && (
                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    ⚠️ Enabling this banner will automatically disable any other active banner. Only one global banner can be displayed at a time.
                  </p>
                </div>
              )}

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
                  {submitting && <LoadingSpinner size="small" />}
                  {editingOffer ? "Update Offer" : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}

