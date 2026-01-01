"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/api";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";
import { Product, Category } from "../../../types";
import { useToast } from "@/app/components/ToastContext";
import { Modal } from "@/app/components/Modal";
import { Pagination } from "@/app/components/Pagination";
import { resolveImageUrl } from "../../../utils/imageUtils";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
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
  });

  // Image upload states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

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
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiFetch("/products");
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

  const handleOpenModal = (product: Product | null = null) => {
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
      });
      setImagePreview(product.image);
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
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (editingProduct) {
        await apiFetch(`/products/${editingProduct.id}`, {
          method: "PATCH",
          body: formData,
        });
        showToast("Product updated successfully", "success");
      } else {
        await apiFetch("/products", {
          method: "POST",
          body: formData,
        });
        showToast("Product created successfully", "success");
      }
      setIsModalOpen(false);
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error("Failed to save product:", error);
      showToast("Error saving product", "error");
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

  const [sortBy, setSortBy] = useState<string>("newest");

  // ... existing state ...

  // ... existing useEffect ...

  // ... existing fetch functions ...

  // ... existing handlers ...

  const filteredProducts = products
    .filter((p) => {
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
  }, [searchTerm, sortBy, selectedCategory]);

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
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2
                      className="animate-spin mx-auto text-black dark:text-white"
                      size={32}
                    />
                  </td>
                </tr>
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={20} />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white">
                            {product.name}
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
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                      ${product.price}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          (product.stock || 0) > 0
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                    value={formData.price || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        price: value === "" ? 0 : parseFloat(value) || 0,
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white cursor-pointer outline-none"
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
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                    value={formData.stock || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        stock: value === "" ? 0 : parseInt(value) || 0,
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Product Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-90 file:cursor-pointer"
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
                  {editingProduct ? "Update Product" : "Create Product"}
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
