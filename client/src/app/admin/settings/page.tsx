"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils/api";
import {
  Settings as SettingsIcon,
  User,
  Globe,
  Share2,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  Upload,
  BarChart3,
  GripVertical,
} from "lucide-react";
import { useToast } from "@/contexts";
import { LoadingSpinner } from "@/components/ui";
import { resolveImageUrl } from "@/lib/utils/imageUtils";
import CustomChartBuilder from "@/components/admin/CustomChartBuilder";
import { dispatchSettingsUpdate } from "@/hooks/useSettings";

interface Settings {
  appName?: string;
  appLogo?: string;
  appIcon?: string;
  heroText?: string;
  heroDescription?: string;
  headingLines?: string;
  requireAccount?: string; // "true" or "false"
  allowGuestCheckout?: string; // "true" or "false"
}

interface Banner {
  id: number;
  title?: string;
  description?: string;
  image: string;
  link?: string;
  position: string;
  isActive: boolean;
  order: number;
}

interface SocialMedia {
  id: number;
  platform: string;
  url: string;
  icon?: string;
  isActive: boolean;
  order: number;
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Settings state
  const [settings, setSettings] = useState<Settings>({});
  const [appLogoFile, setAppLogoFile] = useState<File | null>(null);
  const [appLogoPreview, setAppLogoPreview] = useState<string | null>(null);
  const [appIconFile, setAppIconFile] = useState<File | null>(null);
  const [appIconPreview, setAppIconPreview] = useState<string | null>(null);

  // Banner state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    description: "",
    image: "",
    link: "",
    position: "top",
    isActive: true,
    order: 0,
  });
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);

  // Social media state
  const [socialMediaLinks, setSocialMediaLinks] = useState<SocialMedia[]>([]);
  const [editingSocialMedia, setEditingSocialMedia] = useState<SocialMedia | null>(null);
  const [socialMediaForm, setSocialMediaForm] = useState({
    platform: "",
    url: "",
    icon: "",
    isActive: true,
    order: 0,
  });

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState<string[]>([]);
  const availableStats = [
    { id: 'totalRevenue', label: 'Total Revenue', icon: '💰' },
    { id: 'totalOrders', label: 'Total Orders', icon: '📦' },
    { id: 'totalProducts', label: 'Total Products', icon: '🛍️' },
    { id: 'totalUsers', label: 'Total Users', icon: '👥' },
    { id: 'averageOrderValue', label: 'Avg Order Value', icon: '📊' },
    { id: 'pendingOrders', label: 'Pending Orders', icon: '⏳' },
    { id: 'weekRevenue', label: 'Week Revenue', icon: '📈' },
    { id: 'abandonedCarts', label: 'Abandoned Carts', icon: '🛒' },
  ];

  // Custom charts state
  const [customCharts, setCustomCharts] = useState<any[]>([]);
  const [editingChart, setEditingChart] = useState<any | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [settingsRes, bannersRes, socialMediaRes] = await Promise.all([
        apiFetch("/admin/settings"),
        apiFetch("/admin/banners"),
        apiFetch("/admin/social-media"),
      ]);

      const settingsObj = settingsRes.data.settings || {};
      setSettings(settingsObj);
      if (settingsObj.appLogo) {
        setAppLogoPreview(resolveImageUrl(settingsObj.appLogo));
      }
      if (settingsObj.appIcon) {
        setAppIconPreview(resolveImageUrl(settingsObj.appIcon));
      }

      // Load dashboard stats configuration
      if (settingsObj.dashboardStats) {
        try {
          const stats = JSON.parse(settingsObj.dashboardStats);
          setDashboardStats(Array.isArray(stats) ? stats : []);
        } catch {
          // If parsing fails, use default (all stats)
          setDashboardStats(availableStats.map(s => s.id));
        }
      } else {
        // Default: show all stats
        setDashboardStats(availableStats.map(s => s.id));
      }

      setBanners(bannersRes.data.banners || []);
      setSocialMediaLinks(socialMediaRes.data.links || []);

      // Load custom charts
      try {
        const chartsRes = await apiFetch("/admin/custom-charts");
        setCustomCharts(chartsRes.data.charts || []);
      } catch (error) {
        console.error("Failed to fetch custom charts:", error);
        setCustomCharts([]);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      showToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "icon" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === "logo") {
        setAppLogoFile(file);
        setAppLogoPreview(base64String);
      } else if (type === "icon") {
        setAppIconFile(file);
        setAppIconPreview(base64String);
      } else if (type === "banner") {
        setBannerImageFile(file);
        setBannerImagePreview(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Check if we have file uploads - use FormData if so, otherwise use JSON
      const hasFileUpload = appLogoFile || appIconFile;

      if (hasFileUpload) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Add text settings
        formData.append("appName", settings.appName || "");
        formData.append("heroText", settings.heroText || "");
        formData.append("heroDescription", settings.heroDescription || "");
        formData.append("headingLines", settings.headingLines || "");
        formData.append("requireAccount", settings.requireAccount || "false");
        formData.append("allowGuestCheckout", settings.allowGuestCheckout || "true");

        // Add logo file if changed
        if (appLogoFile) {
          formData.append("logo", appLogoFile);
        } else if (settings.appLogo) {
          // Keep existing logo URL if no new file
          formData.append("appLogo", settings.appLogo);
        }

        // Add icon file if changed (still using base64 for icon for now)
        if (appIconFile) {
          const iconBase64 = await new Promise<string>((resolve) => {
            const iconReader = new FileReader();
            iconReader.onloadend = () => {
              resolve(iconReader.result as string);
            };
            iconReader.readAsDataURL(appIconFile!);
          });
          formData.append("appIcon", iconBase64);
        } else if (settings.appIcon) {
          formData.append("appIcon", settings.appIcon);
        }

        // Save with FormData
        const response = await apiFetch("/admin/settings", {
          method: "PUT",
          body: formData,
        });
        console.log("Settings save response:", response);
        
        // Update local state with response if available
        if (response?.data?.settings) {
          const updatedSettings = response.data.settings;
          if (updatedSettings.appLogo) {
            setSettings(prev => ({ ...prev, appLogo: updatedSettings.appLogo }));
            setAppLogoPreview(resolveImageUrl(updatedSettings.appLogo));
          }
        }
      } else {
        // Use JSON for text-only updates
        const settingsToSave: Record<string, string> = {
          appName: settings.appName || "",
          heroText: settings.heroText || "",
          heroDescription: settings.heroDescription || "",
          headingLines: settings.headingLines || "",
          requireAccount: settings.requireAccount || "false",
          allowGuestCheckout: settings.allowGuestCheckout || "true",
        };

        // Keep existing logo/icon URLs if no new files
        if (settings.appLogo) {
          settingsToSave.appLogo = settings.appLogo;
        }
        if (settings.appIcon) {
          settingsToSave.appIcon = settings.appIcon;
        }

        // Save with JSON
        const response = await apiFetch("/admin/settings", {
          method: "PUT",
          body: settingsToSave,
        });
        console.log("Settings save response:", response);
        
        // Update local state with response if available
        if (response?.data?.settings) {
          const updatedSettings = response.data.settings;
          if (updatedSettings.appLogo) {
            setSettings(prev => ({ ...prev, appLogo: updatedSettings.appLogo }));
            setAppLogoPreview(resolveImageUrl(updatedSettings.appLogo));
          }
        }
      }

      showToast("Settings saved successfully", "success");
      setAppLogoFile(null);
      setAppIconFile(null);
      await fetchAllData();
      console.log("Settings saved, fetched data:", settings);
      // Dispatch event to update all components using settings hooks after data is fetched
      dispatchSettingsUpdate();
    } catch (error) {
      console.error("Failed to save settings:", error);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveBanner = async () => {
    if (!bannerImagePreview && !editingBanner) {
      showToast("Please upload a banner image", "error");
      return;
    }

    try {
      setSaving(true);
      
      // Get image data - use new upload if available, otherwise use existing
      let imageData = bannerImagePreview;
      if (!imageData && editingBanner) {
        imageData = editingBanner.image;
      }
      
      if (!imageData) {
        showToast("Please upload a banner image", "error");
        return;
      }

      // If we have a new file, convert it to base64
      if (bannerImageFile) {
        imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(bannerImageFile!);
        });
      }

      if (editingBanner) {
        await apiFetch(`/admin/banners/${editingBanner.id}`, {
          method: "PUT",
          body: {
            ...bannerForm,
            image: imageData,
          },
        });
      } else {
        await apiFetch("/admin/banners", {
          method: "POST",
          body: {
            ...bannerForm,
            image: imageData,
          },
        });
      }

      showToast("Banner saved successfully", "success");
      setBannerForm({
        title: "",
        description: "",
        image: "",
        link: "",
        position: "top",
        isActive: true,
        order: 0,
      });
      setBannerImageFile(null);
      setBannerImagePreview(null);
      setEditingBanner(null);
      fetchAllData();
    } catch (error) {
      console.error("Failed to save banner:", error);
      showToast("Failed to save banner", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (id: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      await apiFetch(`/admin/banners/${id}`, { method: "DELETE" });
      showToast("Banner deleted successfully", "success");
      fetchAllData();
    } catch (error) {
      console.error("Failed to delete banner:", error);
      showToast("Failed to delete banner", "error");
    }
  };

  const saveSocialMedia = async () => {
    if (!socialMediaForm.platform || !socialMediaForm.url) {
      showToast("Please fill in platform and URL", "error");
      return;
    }

    try {
      setSaving(true);
      if (editingSocialMedia) {
        await apiFetch(`/admin/social-media/${editingSocialMedia.id}`, {
          method: "PUT",
          body: socialMediaForm,
        });
      } else {
        await apiFetch("/admin/social-media", {
          method: "POST",
          body: socialMediaForm,
        });
      }

      showToast("Social media link saved successfully", "success");
      setSocialMediaForm({
        platform: "",
        url: "",
        icon: "",
        isActive: true,
        order: 0,
      });
      setEditingSocialMedia(null);
      fetchAllData();
    } catch (error) {
      console.error("Failed to save social media link:", error);
      showToast("Failed to save social media link", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteSocialMedia = async (id: number) => {
    if (!confirm("Are you sure you want to delete this social media link?")) return;

    try {
      await apiFetch(`/admin/social-media/${id}`, { method: "DELETE" });
      showToast("Social media link deleted successfully", "success");
      fetchAllData();
    } catch (error) {
      console.error("Failed to delete social media link:", error);
      showToast("Failed to delete social media link", "error");
    }
  };

  const saveDashboardStats = async () => {
    try {
      setSaving(true);
      await apiFetch("/admin/settings", {
        method: "PUT",
        body: {
          dashboardStats: JSON.stringify(dashboardStats),
          dashboardStatsVersion: Date.now().toString(), // Add version for sync
        },
      });
      showToast("Dashboard stats saved successfully", "success");
      fetchAllData();
      
      // Trigger a custom event to notify dashboard
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dashboardSettingsUpdated'));
      }
    } catch (error) {
      console.error("Failed to save dashboard stats:", error);
      showToast("Failed to save dashboard stats", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStat = (statId: string) => {
    if (dashboardStats.includes(statId)) {
      setDashboardStats(dashboardStats.filter(id => id !== statId));
    } else {
      setDashboardStats([...dashboardStats, statId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "app", name: "App Settings", icon: Globe },
    { id: "dashboard", name: "Dashboard", icon: BarChart3 },
    { id: "customCharts", name: "Custom Charts", icon: BarChart3 },
    { id: "banners", name: "Banners", icon: ImageIcon },
    { id: "social", name: "Social Media", icon: Share2 },
    { id: "auth", name: "Authentication", icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6 sm:space-y-10 p-4 sm:p-6 lg:p-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black dark:text-white">
          Settings
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-bold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6 text-black dark:text-white">Admin Profile</h2>
          <div className="space-y-4">
            <p className="text-zinc-600 dark:text-zinc-400">
              Profile management is handled through the user profile page. You can update your profile information, change password, and manage your account settings there.
            </p>
            <a
              href="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 transition-opacity"
            >
              Go to Profile
            </a>
          </div>
        </div>
      )}

      {/* App Settings Tab */}
      {activeTab === "app" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 text-black dark:text-white">App Configuration</h2>
            <div className="space-y-6">
              {/* App Name */}
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  App Name
                </label>
                <input
                  type="text"
                  value={settings.appName || ""}
                  onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="Enter app name"
                />
              </div>

              {/* App Logo */}
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  App Logo
                </label>
                <div className="flex items-center gap-4">
                  {appLogoPreview && (
                    <img
                      src={appLogoPreview}
                      alt="Logo preview"
                      className="w-32 h-32 object-contain border border-zinc-200 dark:border-zinc-700 rounded-lg"
                    />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Upload size={18} />
                    <span className="font-bold">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "logo")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* App Icon */}
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  App Icon (Favicon)
                </label>
                <div className="flex items-center gap-4">
                  {appIconPreview && (
                    <img
                      src={appIconPreview}
                      alt="Icon preview"
                      className="w-16 h-16 object-contain border border-zinc-200 dark:border-zinc-700 rounded-lg"
                    />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Upload size={18} />
                    <span className="font-bold">Upload Icon</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "icon")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Hero Text */}
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Hero Text (Main Heading)
                </label>
                <input
                  type="text"
                  value={settings.heroText || ""}
                  onChange={(e) => setSettings({ ...settings, heroText: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="Enter hero text"
                />
              </div>

              {/* Hero Description */}
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Hero Description
                </label>
                <textarea
                  value={settings.heroDescription || ""}
                  onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="Enter hero description"
                  rows={4}
                />
              </div>

              {/* Heading Lines */}
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Heading Lines (comma-separated)
                </label>
                <textarea
                  value={settings.headingLines || ""}
                  onChange={(e) => setSettings({ ...settings, headingLines: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="Line 1, Line 2, Line 3"
                  rows={3}
                />
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 text-black dark:text-white">Dashboard Stats Configuration</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Select which statistics cards to display on the dashboard. Drag to reorder or toggle to show/hide.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {availableStats.map((stat) => {
                const isSelected = dashboardStats.includes(stat.id);
                return (
                  <div
                    key={stat.id}
                    onClick={() => toggleStat(stat.id)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-800 shadow-md"
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{stat.icon}</div>
                      <div className="flex-1">
                        <p className="font-bold text-zinc-900 dark:text-white">{stat.label}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {isSelected ? "Visible" : "Hidden"}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-black dark:border-white bg-black dark:bg-white"
                            : "border-zinc-300 dark:border-zinc-600"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white dark:bg-black" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {dashboardStats.length} of {availableStats.length} stats selected
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Selected stats will appear on the dashboard
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDashboardStats(availableStats.map(s => s.id))}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={() => setDashboardStats([])}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={saveDashboardStats}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Charts Tab */}
      {activeTab === "customCharts" && (
        <div className="space-y-6">
          {editingChart ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <CustomChartBuilder
                chart={editingChart}
                onSave={() => {
                  setEditingChart(null);
                  fetchAllData();
                }}
                onCancel={() => setEditingChart(null)}
              />
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-black dark:text-white">Custom Charts</h2>
                  <button
                    onClick={() => setEditingChart({})}
                    className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 transition-opacity"
                  >
                    <Plus size={18} />
                    Create Chart
                  </button>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                  Create custom charts to visualize your data. Choose any data source and configure X/Y axes.
                </p>
              </div>

              {customCharts.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-12 text-center">
                  <BarChart3 size={48} className="mx-auto text-zinc-400 mb-4" />
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No Custom Charts</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                    Create your first custom chart to visualize your data
                  </p>
                  <button
                    onClick={() => setEditingChart({})}
                    className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 transition-opacity mx-auto"
                  >
                    <Plus size={18} />
                    Create Chart
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customCharts
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((chart) => (
                      <div
                        key={chart.id}
                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-zinc-900 dark:text-white">{chart.name}</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                              {chart.type} • {chart.dataSource}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => setEditingChart(chart)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <Edit2 size={16} />
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm("Are you sure you want to delete this chart?")) return;
                              try {
                                await apiFetch(`/admin/custom-charts/${chart.id}`, { method: "DELETE" });
                                showToast("Chart deleted successfully", "success");
                                fetchAllData();
                              } catch (error) {
                                console.error("Failed to delete chart:", error);
                                showToast("Failed to delete chart", "error");
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === "banners" && (
        <div className="space-y-6">
          {/* Banner Form */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 text-black dark:text-white">
              {editingBanner ? "Edit Banner" : "Add New Banner"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Banner Image
                </label>
                <div className="flex items-center gap-4">
                  {bannerImagePreview && (
                    <img
                      src={bannerImagePreview}
                      alt="Banner preview"
                      className="w-48 h-32 object-cover border border-zinc-200 dark:border-zinc-700 rounded-lg"
                    />
                  )}
                  {editingBanner && !bannerImagePreview && (
                    <img
                      src={resolveImageUrl(editingBanner.image)}
                      alt="Banner preview"
                      className="w-48 h-32 object-cover border border-zinc-200 dark:border-zinc-700 rounded-lg"
                    />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Upload size={18} />
                    <span className="font-bold">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "banner")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="Banner title"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Description (optional)
                </label>
                <textarea
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="Banner description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                    Position
                  </label>
                  <select
                    value={bannerForm.position}
                    onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                    <option value="sidebar">Sidebar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                    Order
                  </label>
                  <input
                    type="number"
                    value={bannerForm.order}
                    onChange={(e) => setBannerForm({ ...bannerForm, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={bannerForm.link}
                  onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bannerForm.isActive}
                  onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-bold text-zinc-900 dark:text-white">Active</label>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={saveBanner}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Save Banner"}
                </button>
                {editingBanner && (
                  <button
                    onClick={() => {
                      setEditingBanner(null);
                      setBannerForm({
                        title: "",
                        description: "",
                        image: "",
                        link: "",
                        position: "top",
                        isActive: true,
                        order: 0,
                      });
                      setBannerImagePreview(null);
                    }}
                    className="flex items-center gap-2 px-6 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Banners List */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 text-black dark:text-white">All Banners</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                >
                  <img
                    src={resolveImageUrl(banner.image)}
                    alt={banner.title || "Banner"}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-zinc-900 dark:text-white">{banner.title || "Untitled"}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{banner.position}</p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setEditingBanner(banner);
                          setBannerForm({
                            title: banner.title || "",
                            description: banner.description || "",
                            image: banner.image,
                            link: banner.link || "",
                            position: banner.position,
                            isActive: banner.isActive,
                            order: banner.order,
                          });
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBanner(banner.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Social Media Tab */}
      {activeTab === "social" && (
        <div className="space-y-6">
          {/* Social Media Form */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 text-black dark:text-white">
              {editingSocialMedia ? "Edit Social Media Link" : "Add Social Media Link"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Platform
                </label>
                <input
                  type="text"
                  value={socialMediaForm.platform}
                  onChange={(e) => setSocialMediaForm({ ...socialMediaForm, platform: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="e.g., Facebook, Twitter, Instagram"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  URL
                </label>
                <input
                  type="url"
                  value={socialMediaForm.url}
                  onChange={(e) => setSocialMediaForm({ ...socialMediaForm, url: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Icon (optional)
                </label>
                <input
                  type="text"
                  value={socialMediaForm.icon}
                  onChange={(e) => setSocialMediaForm({ ...socialMediaForm, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="Icon name or URL"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                    Order
                  </label>
                  <input
                    type="number"
                    value={socialMediaForm.order}
                    onChange={(e) => setSocialMediaForm({ ...socialMediaForm, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    checked={socialMediaForm.isActive}
                    onChange={(e) => setSocialMediaForm({ ...socialMediaForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-bold text-zinc-900 dark:text-white">Active</label>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={saveSocialMedia}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Save Link"}
                </button>
                {editingSocialMedia && (
                  <button
                    onClick={() => {
                      setEditingSocialMedia(null);
                      setSocialMediaForm({
                        platform: "",
                        url: "",
                        icon: "",
                        isActive: true,
                        order: 0,
                      });
                    }}
                    className="flex items-center gap-2 px-6 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Links List */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 text-black dark:text-white">Social Media Links</h2>
            <div className="space-y-2">
              {socialMediaLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                >
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">{link.platform}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {link.url}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSocialMedia(link);
                        setSocialMediaForm({
                          platform: link.platform,
                          url: link.url,
                          icon: link.icon || "",
                          isActive: link.isActive,
                          order: link.order,
                        });
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSocialMedia(link.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Authentication Tab */}
      {activeTab === "auth" && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6 text-black dark:text-white">Authentication Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={settings.requireAccount === "true"}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // If requireAccount is checked, uncheck allowGuestCheckout
                      setSettings({ 
                        ...settings, 
                        requireAccount: "true",
                        allowGuestCheckout: "false"
                      });
                    } else {
                      setSettings({ ...settings, requireAccount: "false" });
                    }
                  }}
                  className="w-5 h-5"
                />
                <span className="font-bold text-zinc-900 dark:text-white">
                  Require Account Before Proceeding
                </span>
              </label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-8">
                If enabled, users must have an account to proceed. They will be prompted to login or signup before continuing.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={settings.allowGuestCheckout === "true"}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // If allowGuestCheckout is checked, uncheck requireAccount
                      setSettings({ 
                        ...settings, 
                        allowGuestCheckout: "true",
                        requireAccount: "false"
                      });
                    } else {
                      setSettings({ ...settings, allowGuestCheckout: "false" });
                    }
                  }}
                  className="w-5 h-5"
                />
                <span className="font-bold text-zinc-900 dark:text-white">
                  Allow Guest Checkout
                </span>
              </label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-8">
                If enabled, users can checkout without creating an account. This setting is ignored if "Require Account" is enabled.
              </p>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Authentication Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

