"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/utils/api";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Video,
  Star,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { useToast } from "@/contexts";
import { Modal, Pagination } from "@/components/ui";
import { resolveImageUrl } from "@/lib/utils/imageUtils";
import { LoadingSpinner, Skeleton } from "@/components/ui";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
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
    productId: null,
  });
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<{
    isOpen: boolean;
    categoryName: string | null;
  }>({ isOpen: false, categoryName: null });

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    category: "",
    description: "",
    image: "/images/placeholder.jpg",
    stock: 0,
    discountPercent: 0,
    sizeEnabled: false,
  });

  // Size management state
  const [productSizes, setProductSizes] = useState<Array<{ size: string; stock: number }>>([]);
  const [newSize, setNewSize] = useState({ size: "", stock: 0 });

  // Media upload states
  interface MediaItem {
    id: string;
    file?: File;
    preview: string; // For display (resolved URL)
    originalUrl?: string; // Original URL from database (for sending back to backend)
    type: "image" | "video";
    isPrimary: boolean;
    order: number;
  }
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  // Category management modal state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<string | null>(null);
  const [newCategoryImageFile, setNewCategoryImageFile] = useState<File | null>(
    null
  );

  // Extract unique categories from products (for backward compatibility)
  const uniqueCategories = [...new Set(products.map((p) => p.category))].filter(
    Boolean
  );

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [showArchived]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showArchived) {
        params.append("includeArchived", "true");
      }
      const url = `/products${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await apiFetch(url);
      setProducts(res.data.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiFetch("/categories");
      const cats = res.data.data || [];
      setCategories(cats);
      // Initialize category discounts from fetched data
      const discountMap: Record<string, number> = {};
      cats.forEach((cat: Category) => {
        if (cat.discountPercent) {
          discountMap[cat.name] = cat.discountPercent;
        }
      });
      setCategoryDiscounts(discountMap);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleSetCategoryDiscount = async (
    categoryName: string,
    discountPercent: number
  ) => {
    if (discountPercent < 0 || discountPercent > 100) {
      showToast("Discount must be between 0 and 100", "error");
      return;
    }

    try {
      await apiFetch(`/admin/categories/${categoryName}/discount`, {
        method: "PATCH",
        body: { discountPercent },
      });
      showToast(`Discount set for ${categoryName}`, "success");
      fetchCategories();
    } catch (error) {
      console.error("Failed to set category discount:", error);
      showToast("Failed to set category discount", "error");
    }
  };

  const handleOpenModal = async (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description || "",
        image: product.image,
        stock: product.stock || 0,
        discountPercent: product.discountPercent || 0,
        sizeEnabled: product.sizeEnabled || false,
      });
      
      // Load sizes if sizeEnabled
      if (product.sizeEnabled && product.id) {
        try {
          const sizesRes = await apiFetch(`/products/${product.id}/sizes`);
          setProductSizes(sizesRes.data.sizes || []);
        } catch (error) {
          console.error("Failed to load sizes:", error);
          setProductSizes([]);
        }
      } else {
        setProductSizes([]);
      }
      // Load existing media if available
      if (product.media && product.media.length > 0) {
        const existingMedia: MediaItem[] = product.media.map((m, index) => ({
          id: `existing-${m.id}`,
          preview: resolveImageUrl(m.url), // For display
          originalUrl: m.url, // Original URL from database
          type: m.type as "image" | "video",
          isPrimary: m.isPrimary,
          order: m.order,
        }));
        setMediaItems(existingMedia);
      } else {
        setMediaItems([{
          id: 'existing-main',
          preview: resolveImageUrl(product.image), // For display
          originalUrl: product.image, // Original URL from database
          type: "image",
          isPrimary: true,
          order: 0,
        }]);
      }
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        price: 0,
        category: "",
        description: "",
        image: "/images/placeholder.jpg",
        stock: 0,
        discountPercent: 0,
        sizeEnabled: false,
      });
      setMediaItems([]);
      setProductSizes([]);
      setNewSize({ size: "", stock: 0 });
    }
    setIsModalOpen(true);
  };

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = Array.from(e.target.files || []);
    const maxSize = type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for videos
    
    files.forEach((file) => {
      // Validate file type
      const isValidType = type === "image" 
        ? file.type.startsWith("image/")
        : file.type.startsWith("video/");
      
      if (!isValidType) {
        showToast(`Please select a valid ${type} file`, "error");
        return;
      }
      
      // Validate file size
      if (file.size > maxSize) {
        showToast(`${type === "image" ? "Image" : "Video"} size must be less than ${maxSize / (1024 * 1024)}MB`, "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        
        // Check if this will be the only image after adding
        const allImagesAfterAdd = [...mediaItems.filter(item => item.type === "image"), { type } as MediaItem];
        const willBeOnlyImage = type === "image" && allImagesAfterAdd.length === 1;
        
        const newItem: MediaItem = {
          id: `new-${Date.now()}-${Math.random()}`,
          file,
          preview,
          type,
          // If this is the first item OR if this will be the only image, make it primary
          isPrimary: mediaItems.length === 0 || willBeOnlyImage,
          order: mediaItems.length,
        };
        
        // If this will be the only image, unset primary from other items
        if (willBeOnlyImage) {
          const updatedItems = mediaItems.map(item => ({ ...item, isPrimary: false }));
          setMediaItems([...updatedItems, newItem]);
        } else {
          setMediaItems([...mediaItems, newItem]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = '';
  };

  const handleRemoveMedia = (id: string) => {
    const newItems = mediaItems.filter(item => item.id !== id);
    // If we removed the primary item, make the first remaining item primary
    if (newItems.length > 0 && mediaItems.find(item => item.id === id)?.isPrimary) {
      newItems[0].isPrimary = true;
    }
    setMediaItems(newItems);
  };

  const handleSetPrimary = (id: string) => {
    setMediaItems(mediaItems.map(item => ({
      ...item,
      isPrimary: item.id === id,
    })));
  };

  const handleMoveMedia = (id: string, direction: "up" | "down") => {
    const index = mediaItems.findIndex(item => item.id === id);
    if (index === -1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= mediaItems.length) return;

    const newItems = [...mediaItems];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    // Update order values
    newItems.forEach((item, idx) => {
      item.order = idx;
    });
    
    setMediaItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      if (!baseUrl.includes('/api/v1')) baseUrl = `${baseUrl}/api/v1`;
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price.toString());
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("stock", formData.stock.toString());
      formDataToSend.append("discountPercent", (formData.discountPercent || 0).toString());
      formDataToSend.append("sizeEnabled", formData.sizeEnabled.toString());

      // Separate items with files (new uploads) and items without files (existing)
      const itemsWithFiles = mediaItems.filter(item => item.file);
      const itemsWithoutFiles = mediaItems.filter(item => !item.file);

      // Add image files (only new uploads)
      const imageFiles = itemsWithFiles.filter(item => item.type === "image");
      imageFiles.forEach((item) => {
        if (item.file) {
          formDataToSend.append("images", item.file);
        }
      });

      // Add video files (only new uploads)
      const videoFiles = itemsWithFiles.filter(item => item.type === "video");
      videoFiles.forEach((item) => {
        if (item.file) {
          formDataToSend.append("videos", item.file);
        }
      });

      // Create metadata array for ALL media (existing + new), sorted by order
      // This includes both new uploads and existing media
      const allMediaSorted = [...mediaItems].sort((a, b) => a.order - b.order);
      const mediaMetadata: Array<{ 
        type: string; 
        isPrimary: boolean; 
        order: number;
        url?: string; // For existing media
        isNew?: boolean; // Flag to indicate if it's a new upload
      }> = [];
      
      // Process all media in order
      allMediaSorted.forEach((item) => {
        if (item.file) {
          // New upload - will be processed by backend
          mediaMetadata.push({
            type: item.type,
            isPrimary: item.isPrimary,
            order: item.order,
            isNew: true,
          });
        } else {
          // Existing media - include original URL from database
          mediaMetadata.push({
            type: item.type,
            isPrimary: item.isPrimary,
            order: item.order,
            url: item.originalUrl || item.preview, // Use originalUrl if available, fallback to preview
            isNew: false,
          });
        }
      });

      // Always send mediaData, even if empty, so backend knows to preserve existing media
      formDataToSend.append("mediaData", JSON.stringify(mediaMetadata));

      const url = editingProduct 
        ? `${baseUrl}/products/${editingProduct.id}`
        : `${baseUrl}/products`;
      const method = editingProduct ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save product");
      }

      const productId = editingProduct ? editingProduct.id : data.data.data.id;
      
      // Handle size management if sizeEnabled
      if (formData.sizeEnabled && productId) {
        // First, toggle size enabled
        await apiFetch(`/products/${productId}/size-enabled`, {
          method: "PATCH",
          body: { sizeEnabled: true },
        });
        
        // Then, save all sizes
        for (const sizeItem of productSizes) {
          await apiFetch(`/products/${productId}/sizes`, {
            method: "POST",
            body: { size: sizeItem.size, stock: sizeItem.stock },
          });
        }
      } else if (productId) {
        // Disable sizes if unchecked
        await apiFetch(`/products/${productId}/size-enabled`, {
          method: "PATCH",
          body: { sizeEnabled: false },
        });
      }

      showToast(editingProduct ? "Product updated successfully" : "Product created successfully", "success");
      setIsModalOpen(false);
      fetchProducts();
      fetchCategories();
    } catch (error: any) {
      console.error("Failed to save product:", error);
      showToast(error.message || "Error saving product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const [categoryBeingEdited, setCategoryBeingEdited] = useState<string | null>(
    null
  );
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const [editingCategoryImage, setEditingCategoryImage] = useState<
    string | null | undefined
  >(undefined);
  const [editingCategoryImageFile, setEditingCategoryImageFile] =
    useState<File | null>(null);
  const [categoryDiscounts, setCategoryDiscounts] = useState<
    Record<string, number>
  >({});

  const handleEditCategoryImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image file", "error");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be less than 5MB", "error");
        return;
      }

      setEditingCategoryImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditingCategoryImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image file", "error");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be less than 5MB", "error");
        return;
      }

      setNewCategoryImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setNewCategoryImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const trimmedName = newCategoryName.trim();

    // Check if category already exists
    if (categories.some((cat) => cat.name === trimmedName)) {
      showToast("Category already exists", "error");
      return;
    }

    setSubmitting(true);
    try {
      const requestBody: { name: string; image?: string | null } = {
        name: trimmedName,
      };

      // Only include image if it's not null
      if (newCategoryImage) {
        requestBody.image = newCategoryImage;
      }

      const response = await apiFetch("/categories", {
        method: "POST",
        body: requestBody,
      });

      showToast("Category added successfully", "success");
      setNewCategoryName("");
      setNewCategoryImage(null);
      setNewCategoryImageFile(null);
      // Refresh categories to get the updated list with images
      await fetchCategories();
    } catch (error) {
      console.error("Failed to add category:", error);
      showToast("Error adding category", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = async (oldName: string) => {
    // Allow update if name changed OR if image is being updated
    const nameChanged =
      editingCategoryValue && editingCategoryValue !== oldName;
    const imageChanged = editingCategoryImage !== undefined;

    if (!nameChanged && !imageChanged) {
      setCategoryBeingEdited(null);
      setEditingCategoryImage(undefined);
      setEditingCategoryImageFile(null);
      return;
    }

    setSubmitting(true);
    try {
      const updateData: { newName?: string; image?: string | null } = {};

      // Only include newName if it actually changed
      if (nameChanged && editingCategoryValue) {
        updateData.newName = editingCategoryValue;
      }

      // Always include image if it was set (even if null to remove image)
      if (imageChanged) {
        updateData.image = editingCategoryImage;
      }

      await apiFetch(`/categories/${oldName}`, {
        method: "PATCH",
        body: updateData,
      });
      showToast("Category updated successfully", "success");
      setCategoryBeingEdited(null);
      setEditingCategoryImage(undefined);
      setEditingCategoryImageFile(null);
      await fetchCategories();
      fetchProducts(); // Refresh products to see updated category names
    } catch (error) {
      console.error("Failed to edit category:", error);
      showToast("Error updating category", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = (name: string) => {
    setDeleteCategoryModal({ isOpen: true, categoryName: name });
  };

  const handleConfirmDeleteCategory = async () => {
    const name = deleteCategoryModal.categoryName;
    if (!name) return;

    setDeleteCategoryModal({ isOpen: false, categoryName: null });
    setSubmitting(true);
    try {
      await apiFetch(`/categories/${name}`, { method: "DELETE" });
      showToast("Category deleted successfully", "success");
      fetchCategories();
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete category:", error);
      showToast("Error deleting category", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteModal({
      isOpen: true,
      productId: id,
    });
  };

  const handleConfirmDelete = async () => {
    const id = deleteModal.productId;
    if (!id) return;

    setDeleteModal((prev) => ({ ...prev, isOpen: false }));
    try {
      await apiFetch(`/products/${id}`, { method: "DELETE" });
      showToast("Product deleted successfully", "success");
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
      showToast("Error deleting product", "error");
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await apiFetch(`/products/${id}/archive`, { method: "PATCH" });
      showToast("Product archived successfully", "success");
      fetchProducts();
    } catch (error) {
      console.error("Failed to archive product:", error);
      showToast("Failed to archive product", "error");
    }
  };

  const handleUnarchive = async (id: number) => {
    try {
      await apiFetch(`/products/${id}/unarchive`, { method: "PATCH" });
      showToast("Product unarchived successfully", "success");
      fetchProducts();
    } catch (error) {
      console.error("Failed to unarchive product:", error);
      showToast("Failed to unarchive product", "error");
    }
  };

  const [sortBy, setSortBy] = useState<string>("newest");

  // ... existing state ...

  // ... existing useEffect ...

  // ... existing fetch functions ...

  // ... existing handlers ...

  const filteredProducts = products
    .filter((p) => {
      // Archive filter - show all if showArchived is true, otherwise filter out archived
      if (!showArchived && p.isArchived) {
        return false;
      }
      if (showArchived && !p.isArchived) {
        return false;
      }
      // Category filter
      if (selectedCategory && p.category !== selectedCategory) {
        return false;
      }
      // Search filter
      return (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.id - a.id;
        case "oldest":
          return a.id - b.id;
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return a.category.localeCompare(b.category);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
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
  }, [searchTerm, sortBy, selectedCategory, showArchived]);

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">
            Products
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Manage inventory and details.
          </p>
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
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-0 transition-all text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <input
              type="checkbox"
              id="showArchived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4 text-black dark:text-white border-zinc-300 dark:border-zinc-600 rounded focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
            />
            <label htmlFor="showArchived" className="text-sm font-bold text-zinc-900 dark:text-white cursor-pointer whitespace-nowrap">
              Show Archived
            </label>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-0 transition-all text-zinc-900 dark:text-white outline-none cursor-pointer text-sm font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
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
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Product
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Category
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Price
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Stock
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-12" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400 relative">
                          {(() => {
                            // Get primary image from media, or fallback to product.image
                            const primaryImage = product.media?.find(m => m.isPrimary && m.type === "image") || 
                                                 product.media?.find(m => m.type === "image") || 
                                                 product.media?.[0];
                            const imageUrl = primaryImage 
                              ? resolveImageUrl(primaryImage.url) 
                              : (product.image && product.image.trim() !== '' && product.image !== 'null' && product.image !== 'undefined' 
                                  ? resolveImageUrl(product.image) 
                                  : '');
                            const hasValidImage = imageUrl && imageUrl.trim() !== '' && !imageUrl.includes('undefined') && !imageUrl.includes('null');
                            
                            if (!hasValidImage) {
                              return <ImageIcon size={20} className="text-zinc-400 dark:text-zinc-500" />;
                            }
                            
                            return (
                              <>
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                      const icon = parent.querySelector('.product-list-icon') as HTMLElement;
                                      if (icon) icon.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div className="product-list-icon absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                                  <ImageIcon size={20} className="text-zinc-400 dark:text-zinc-500" />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-white">
                              {product.name}
                            </span>
                            {product.isArchived && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                Archived
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-zinc-500 truncate max-w-[200px]">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.discountPercent && product.discountPercent > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-zinc-400 line-through">
                            ${product.price}
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white">
                            $
                            {(
                              product.price *
                              (1 - product.discountPercent / 100)
                            ).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                            {product.discountPercent}% OFF
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-zinc-900 dark:text-white">
                          ${product.price}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${(product.stock || 0) > 0
                          ? "bg-zinc-200 text-black dark:bg-zinc-700 dark:text-white"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                      >
                        {product.stock || 0} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        {product.isArchived ? (
                          <button
                            onClick={() => handleUnarchive(product.id)}
                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors cursor-pointer"
                            title="Unarchive"
                          >
                            <ArchiveRestore size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(product.id)}
                            className="p-2 text-zinc-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 rounded-lg transition-colors cursor-pointer"
                            title="Archive"
                          >
                            <Archive size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(product.id)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {editingProduct ? "Edit Product" : "Create New Product"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form Fields */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-black dark:focus:border-white transition-all text-zinc-900 dark:text-white outline-none"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                        Price ($) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-black dark:focus:border-white transition-all text-zinc-900 dark:text-white outline-none"
                        value={formData.price || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({
                            ...formData,
                            price: value === "" ? 0 : parseFloat(value) || 0,
                          });
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-black dark:focus:border-white transition-all text-zinc-900 dark:text-white cursor-pointer outline-none"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-black dark:focus:border-white transition-all text-zinc-900 dark:text-white outline-none"
                        value={formData.stock === 0 ? "0" : (formData.stock?.toString() || "")}
                        onChange={(e) => {
                          let value = e.target.value;
                          
                          // Only allow digits
                          value = value.replace(/[^0-9]/g, '');
                          
                          // Remove leading zeros immediately (except for single "0")
                          if (value.length > 1 && value.startsWith('0')) {
                            value = value.replace(/^0+/, '') || '0';
                          }
                          
                          // Parse the value
                          const parsedValue = value === "" ? 0 : parseInt(value, 10);
                          const stockValue = isNaN(parsedValue) ? 0 : parsedValue;
                          
                          setFormData({
                            ...formData,
                            stock: stockValue,
                          });
                        }}
                        onBlur={(e) => {
                          // Ensure value is cleaned up on blur
                          const value = e.target.value;
                          const parsedValue = value === "" ? 0 : parseInt(value, 10);
                          const stockValue = isNaN(parsedValue) ? 0 : parsedValue;
                          if (formData.stock !== stockValue) {
                            setFormData({
                              ...formData,
                              stock: stockValue,
                            });
                          }
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-black dark:focus:border-white transition-all text-zinc-900 dark:text-white outline-none"
                        value={formData.discountPercent || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({
                            ...formData,
                            discountPercent:
                              value === "" ? 0 : parseFloat(value) || 0,
                          });
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-black dark:focus:border-white transition-all text-zinc-900 dark:text-white outline-none resize-none"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Enter product description..."
                    />
                  </div>

                  {/* Size Management */}
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-zinc-900 dark:text-white">
                        Enable Size Management
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.sizeEnabled}
                          onChange={(e) => {
                            setFormData({ ...formData, sizeEnabled: e.target.checked });
                            if (!e.target.checked) {
                              setProductSizes([]);
                            }
                          }}
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-300 dark:peer-focus:ring-zinc-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-black dark:peer-checked:bg-white"></div>
                      </label>
                    </div>

                    {formData.sizeEnabled && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Size (e.g., S, M, L, XL)"
                            className="flex-1 px-4 py-2 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-black dark:focus:border-white transition-all text-zinc-900 dark:text-white outline-none"
                            value={newSize.size}
                            onChange={(e) => setNewSize({ ...newSize, size: e.target.value.toUpperCase() })}
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Stock"
                            className="w-24 px-4 py-2 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-black dark:focus:border-white transition-all text-zinc-900 dark:text-white outline-none"
                            value={newSize.stock || ""}
                            onChange={(e) => setNewSize({ ...newSize, stock: parseInt(e.target.value) || 0 })}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newSize.size && newSize.stock >= 0) {
                                const exists = productSizes.find(s => s.size === newSize.size);
                                if (exists) {
                                  setProductSizes(productSizes.map(s => 
                                    s.size === newSize.size ? { ...s, stock: newSize.stock } : s
                                  ));
                                } else {
                                  setProductSizes([...productSizes, { ...newSize }]);
                                }
                                setNewSize({ size: "", stock: 0 });
                              }
                            }}
                            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-all font-medium cursor-pointer"
                          >
                            Add
                          </button>
                        </div>

                        {productSizes.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">Sizes:</p>
                            <div className="flex flex-wrap gap-2">
                              {productSizes.map((sizeItem, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                                >
                                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                    {sizeItem.size}: {sizeItem.stock}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProductSizes(productSizes.filter((_, i) => i !== index));
                                    }}
                                    className="text-red-600 hover:text-red-700 cursor-pointer"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Media Upload */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                      Product Media (Images & Videos)
                    </label>
                    
                    {/* Add Media Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <label className="flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-black dark:hover:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer group">
                        <ImageIcon className="text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" size={24} />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white">
                          Add Images
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleAddMedia(e, "image")}
                          className="hidden"
                        />
                      </label>
                      <label className="flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-black dark:hover:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer group">
                        <Video className="text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" size={24} />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white">
                          Add Videos
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={(e) => handleAddMedia(e, "video")}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Media List - Scrollable */}
                    {mediaItems.length > 0 ? (
                      <div className="border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-3">
                          {mediaItems
                            .sort((a, b) => a.order - b.order)
                            .map((item, index) => (
                              <div
                                key={item.id}
                                className="group relative bg-white dark:bg-zinc-900 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden hover:border-black dark:hover:border-white transition-all"
                              >
                                {/* Preview */}
                                <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                  {item.type === "image" ? (
                                    <img
                                      src={item.preview}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <video
                                      src={item.preview}
                                      className="w-full h-full object-cover"
                                      controls={false}
                                      muted
                                      playsInline
                                      onMouseEnter={(e) => {
                                        const video = e.currentTarget;
                                        video.play().catch(() => {});
                                      }}
                                      onMouseLeave={(e) => {
                                        const video = e.currentTarget;
                                        video.pause();
                                        video.currentTime = 0;
                                      }}
                                    />
                                  )}
                                  {item.isPrimary && (
                                    <div className="absolute top-2 left-2 bg-yellow-500 rounded-full p-1.5 shadow-lg">
                                      <Star size={14} className="text-white fill-white" />
                                    </div>
                                  )}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMedia(item.id)}
                                      className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Controls */}
                                <div className="p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                                      {item.type}
                                    </span>
                                    {item.isPrimary && (
                                      <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full font-medium">
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSetPrimary(item.id)}
                                      disabled={item.isPrimary}
                                      className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer font-medium"
                                    >
                                      {item.isPrimary ? "Primary" : "Set Primary"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveMedia(item.id, "up")}
                                      disabled={index === 0}
                                      className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                                      title="Move up"
                                    >
                                      <ChevronUp size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveMedia(item.id, "down")}
                                      disabled={index === mediaItems.length - 1}
                                      className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                                      title="Move down"
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 p-12 flex flex-col items-center justify-center text-center">
                        <ImageIcon className="text-zinc-400 mb-3" size={48} />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                          No media added yet
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                          Add images or videos to showcase your product
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:opacity-90"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>{editingProduct ? "Updating..." : "Creating..."}</span>
                    </>
                  ) : (
                    <span>{editingProduct ? "Update Product" : "Create Product"}</span>
                  )}
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

      {/* Delete Category Confirmation Modal */}
      <Modal
        isOpen={deleteCategoryModal.isOpen}
        onClose={() =>
          setDeleteCategoryModal({ isOpen: false, categoryName: null })
        }
        onConfirm={handleConfirmDeleteCategory}
        title="Delete Category"
        message={
          deleteCategoryModal.categoryName
            ? `Are you sure you want to delete "${deleteCategoryModal.categoryName}"? Products in this category will be uncategorized.`
            : ""
        }
        confirmText="Delete Category"
        type="danger"
        loading={submitting}
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
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryBeingEdited(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Add New Section */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Add New Category
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Category name..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleQuickAddCategory()
                      }
                    />
                    <button
                      onClick={handleQuickAddCategory}
                      disabled={submitting || !newCategoryName}
                      className="p-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-zinc-900/10 dark:shadow-white/10"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Category Image (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCategoryImageUpload}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-90 file:cursor-pointer"
                    />
                    {newCategoryImage && (
                      <div className="mt-2">
                        <img
                          src={newCategoryImage}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-xl border border-zinc-200 dark:border-zinc-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* List Section */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Existing Categories
                </label>
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="group flex flex-col gap-2 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
                      >
                        {categoryBeingEdited === cat.name ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                autoFocus
                                className="flex-1 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-black dark:border-white text-sm outline-none"
                                value={editingCategoryValue}
                                onChange={(e) =>
                                  setEditingCategoryValue(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleEditCategory(cat.name)
                                }
                              />
                              <button
                                onClick={() => handleEditCategory(cat.name)}
                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg transition-colors"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setCategoryBeingEdited(null);
                                  setEditingCategoryImage(undefined);
                                  setEditingCategoryImageFile(null);
                                }}
                                className="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Category Image
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditCategoryImageUpload}
                                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-90 file:cursor-pointer"
                              />
                              {(editingCategoryImage || cat.image) && (
                                <div className="mt-2">
                                  <img
                                    src={
                                      editingCategoryImage ||
                                      (cat.image
                                        ? resolveImageUrl(cat.image)
                                        : "")
                                    }
                                    alt="Preview"
                                    className="w-full h-24 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {cat.image ? (
                                  <img
                                    src={resolveImageUrl(cat.image)}
                                    alt={cat.name}
                                    className="w-10 h-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                    <ImageIcon
                                      size={20}
                                      className="text-zinc-400"
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {cat.name}
                                  </span>
                                  {cat.discountPercent &&
                                    cat.discountPercent > 0 && (
                                      <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-bold">
                                        {cat.discountPercent}% OFF
                                      </span>
                                    )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setCategoryBeingEdited(cat.name);
                                    setEditingCategoryValue(cat.name);
                                    setEditingCategoryImage(undefined);
                                    setEditingCategoryImageFile(null);
                                  }}
                                  className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.name)}
                                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="Discount %"
                                className="flex-1 px-2 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
                                value={categoryDiscounts[cat.name] || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCategoryDiscounts({
                                    ...categoryDiscounts,
                                    [cat.name]:
                                      value === "" ? 0 : parseFloat(value) || 0,
                                  });
                                }}
                                onBlur={() => {
                                  const discount =
                                    categoryDiscounts[cat.name] || 0;
                                  handleSetCategoryDiscount(cat.name, discount);
                                }}
                              />
                              <span className="text-xs text-zinc-500">%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-xs text-zinc-500 italic">
                      No categories found.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryBeingEdited(null);
                  setEditingCategoryImage(undefined);
                  setEditingCategoryImageFile(null);
                  setNewCategoryImage(null);
                  setNewCategoryImageFile(null);
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
