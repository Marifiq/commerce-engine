"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { productService } from "../../../services/productService";
import { apiFetch } from "../../../utils/api";
import { Product, Category } from "../../../types";
import Link from "next/link";
import ProductCard from "../../components/ProductCard";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Skeleton from "../../components/ui/Skeleton";
import {
  Filter,
  Search,
  SlidersHorizontal,
  ChevronRight,
  X,
  Tag,
} from "lucide-react";

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialCategory = searchParams.get("category") || "";
  const section = searchParams.get("section") || "";
  const initialShowOffOnly =
    searchParams.get("off") === "true" || section === "off";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState(
    section === "new-arrivals" ? "newest" : "newest"
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showOffOnly, setShowOffOnly] = useState(initialShowOffOnly);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Update activeCategory and showOffOnly when URL changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category") || "";
    const sectionFromUrl = searchParams.get("section") || "";
    const offFromUrl =
      searchParams.get("off") === "true" || sectionFromUrl === "off";
    setActiveCategory(categoryFromUrl);
    setShowOffOnly(offFromUrl);
  }, [searchParams]);

  // Update URL params when filters change (excluding section-specific routes)
  const updateUrlParams = useCallback(
    (category: string, off: boolean) => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (off) {
        params.set("off", "true");
        // Remove section=off if it exists, as we're using off=true instead
        params.delete("section");
      } else {
        params.delete("off");
      }
      const query = params.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname]
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Get current section from URL
      const currentSection = searchParams.get("section") || "";

      // Handle off section (discounted products) - legacy support
      if (currentSection === "off") {
        try {
          const res = await apiFetch("/products/off");
          const data = res.data.data || [];
          // Apply category filter if selected
          const filtered = activeCategory
            ? data.filter((p: Product) => p.category === activeCategory)
            : data;
          setProducts(filtered);
        } catch (error) {
          console.error("Failed to fetch discounted products:", error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Handle best sellers section
      if (currentSection === "best-sellers") {
        const data = await productService.getBestSellers();
        // Apply category filter if selected
        const filtered = activeCategory
          ? data.filter((p) => p.category === activeCategory)
          : data;
        setProducts(filtered);
        setLoading(false);
        return;
      }

      // Handle showOffOnly toggle (show discounted products only)
      if (showOffOnly && currentSection !== "new-arrivals") {
        try {
          const res = await apiFetch("/products/off");
          const data = res.data.data || [];
          // Apply category filter if selected
          const filtered = activeCategory
            ? data.filter((p: Product) => p.category === activeCategory)
            : data;
          setProducts(filtered);
        } catch (error) {
          console.error("Failed to fetch discounted products:", error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Handle new arrivals and regular shop
      const params = new URLSearchParams();

      // Add category filter if selected
      if (activeCategory) {
        params.append("category", activeCategory);
      }

      // For new arrivals, always sort by newest
      if (currentSection === "new-arrivals") {
        params.append("sort", "-id");
      } else {
        // Add sort parameter for regular shop
        switch (sortBy) {
          case "price-low":
            params.append("sort", "price");
            break;
          case "price-high":
            params.append("sort", "-price");
            break;
          case "newest":
          default:
            params.append("sort", "-id");
            break;
        }
      }

      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await productService.getAllProducts(query);
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, sortBy, searchParams, showOffOnly]);

  const fetchCategories = async () => {
    try {
      const res = await apiFetch("/categories");
      setCategories(res.data.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero / Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
              <Link
                href="/"
                className="hover:text-black dark:hover:text-white transition-colors"
              >
                Home
              </Link>
              <ChevronRight size={12} />
              <span className="text-black dark:text-white">Shop</span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-black dark:text-white">
              {section === "new-arrivals"
                ? "New Arrivals"
                : section === "best-sellers"
                ? "Best Sellers"
                : section === "off"
                ? "Off"
                : showOffOnly
                ? activeCategory
                  ? `${activeCategory} - On Sale`
                  : "On Sale"
                : activeCategory || "All Products"}
            </h1>
            <p className="text-zinc-500 font-medium max-w-lg">
              {section === "new-arrivals"
                ? "Fresh drops from our latest collection"
                : section === "best-sellers"
                ? "Our most popular designs, meticulously crafted and loved by our community worldwide"
                : section === "off"
                ? "Special discounts on selected items - Limited time offers"
                : showOffOnly
                ? "Special discounts on selected items - Limited time offers"
                : "Discover our premium collection of high-quality apparel and accessories."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group flex-1 md:w-64">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors"
                size={18}
              />
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
              className={`p-3 rounded-2xl border transition-all md:hidden ${
                isFilterOpen
                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              }`}
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
                  onClick={() => {
                    setActiveCategory("");
                    updateUrlParams("", showOffOnly);
                  }}
                  className={`text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer ${
                    activeCategory === ""
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10"
                      : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.name);
                      updateUrlParams(cat.name, showOffOnly);
                    }}
                    className={`text-left px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer ${
                      activeCategory === cat.name
                        ? "bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10"
                        : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Show Only Discounted Products Toggle */}
            {section !== "new-arrivals" && section !== "best-sellers" && (
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center gap-2">
                  <Tag size={14} /> Offers
                </h3>
                <label className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
                  <span className="text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                    Show Only Discounted
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showOffOnly}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setShowOffOnly(newValue);
                        updateUrlParams(activeCategory, newValue);
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-all duration-200 ${
                        showOffOnly
                          ? "bg-black dark:bg-white"
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white dark:bg-black rounded-full transition-transform duration-200 transform ${
                          showOffOnly ? "translate-x-6" : "translate-x-0.5"
                        } mt-0.5 shadow-md`}
                      />
                    </div>
                  </div>
                </label>
              </div>
            )}

            {section !== "best-sellers" && (
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  Sort By
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-bold cursor-pointer"
                  disabled={section === "new-arrivals"}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            )}
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="group relative h-full flex flex-col">
                    <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <div className="mt-4 flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : section === "off" ? (
              <div className="flex flex-col items-center justify-center py-32 bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="p-6 bg-white dark:bg-black rounded-3xl shadow-xl mb-6">
                  <Search size={48} className="text-zinc-200" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
                  No Offers Available
                </h3>
                <p className="text-zinc-500 font-medium">
                  Check back soon for exciting discounts and special offers!
                </p>
                <Link
                  href="/shop"
                  className="mt-8 px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all"
                >
                  Browse All Products
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="p-6 bg-white dark:bg-black rounded-3xl shadow-xl mb-6">
                  <Search size={48} className="text-zinc-200" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
                  No products found
                </h3>
                <p className="text-zinc-500 font-medium">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={() => {
                    setActiveCategory("");
                    setSearchTerm("");
                    setShowOffOnly(false);
                    updateUrlParams("", false);
                  }}
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
      <div
        className={`fixed inset-0 z-[100] transition-all duration-500 md:hidden ${
          isFilterOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsFilterOpen(false)}
        />
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[40px] p-8 shadow-2xl transition-transform duration-500 ${
            isFilterOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
              Filters
            </h2>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setActiveCategory("");
                    updateUrlParams("", showOffOnly);
                    setIsFilterOpen(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                    activeCategory === ""
                      ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.name);
                      updateUrlParams(cat.name, showOffOnly);
                      setIsFilterOpen(false);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                      activeCategory === cat.name
                        ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Show Only Discounted Products Toggle - Mobile */}
            {section !== "new-arrivals" && section !== "best-sellers" && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                  Offers
                </h3>
                <label className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl cursor-pointer">
                  <span className="text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                    Show Only Discounted
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showOffOnly}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setShowOffOnly(newValue);
                        updateUrlParams(activeCategory, newValue);
                        setIsFilterOpen(false);
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-all duration-200 ${
                        showOffOnly
                          ? "bg-black dark:bg-white"
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white dark:bg-black rounded-full transition-transform duration-200 transform ${
                          showOffOnly ? "translate-x-6" : "translate-x-0.5"
                        } mt-0.5 shadow-md`}
                      />
                    </div>
                  </div>
                </label>
              </div>
            )}

            {section !== "best-sellers" && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                  Sort By
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: "newest", label: "Newest First" },
                    { id: "price-low", label: "Price: Low to High" },
                    { id: "price-high", label: "Price: High to Low" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSortBy(option.id);
                        setIsFilterOpen(false);
                      }}
                      disabled={section === "new-arrivals"}
                      className={`text-left px-6 py-4 rounded-2xl font-bold transition-all ${
                        sortBy === option.id
                          ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
                          : "text-zinc-500"
                      } ${
                        section === "new-arrivals"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
