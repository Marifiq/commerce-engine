"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  ClipboardList,
  MessageSquare,
  LogOut,
  Home,
  X,
  Menu,
  ShoppingCart,
  Tag,
  Settings,
  Mail,
  Package,
  DollarSign,
  FileText,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { logout } from "@/store/features/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppLogo } from "@/hooks/useSettings";
import { resolveImageUrl } from "@/lib/utils/imageUtils";
import Image from "next/image";
import { useToast } from "@/contexts";
import { getUnreadCount } from "@/services/message.service";
import { useSocket } from "@/hooks/useSocket";

const menuItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Orders", href: "/admin/orders", icon: ClipboardList },
  {
    name: "Abandoned Carts",
    href: "/admin/abandoned-carts",
    icon: ShoppingCart,
  },
  { name: "Refunds", href: "/admin/refunds", icon: DollarSign },
  { name: "Returns", href: "/admin/returns", icon: Package },
  { name: "Offers", href: "/admin/offers", icon: Tag },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Policies", href: "/admin/policies", icon: FileText },
  { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { appLogo } = useAppLogo();
  const { currentUser } = useAppSelector((state) => state.user);
  const adminName = currentUser?.name || "Admin";
  const { showToast } = useToast();

  const { socket, on, off } = useSocket();

  // Load unread count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const data = await getUnreadCount();
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Failed to load unread count:', error);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Refresh every 30 seconds

    // Listen for new messages to update unread count
    if (socket) {
      const handleNewMessage = () => {
        loadUnreadCount();
      };
      
      on('new-message', handleNewMessage);
      
      return () => {
        off('new-message', handleNewMessage);
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, [socket, on, off]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isOpen) {
      // Defer state update to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => setIsOpen(false), 0);
      return () => clearTimeout(timeoutId);
    }
  }, [pathname, isOpen]);

  const handleLogout = () => {
    dispatch(logout());
    showToast("You have been logged out", "success");
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Header/Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 z-40">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {appLogo ? (
            <div className="relative h-8 w-auto max-w-[140px] flex-shrink-0">
              <Image
                src={resolveImageUrl(appLogo)}
                alt="Admin Panel"
                width={140}
                height={32}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
          ) : (
            <h1 className="text-lg sm:text-xl font-black uppercase tracking-tighter text-black dark:text-white truncate">
              Admin Panel
            </h1>
          )}
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {appLogo ? (
              <div className="relative h-10 w-auto max-w-[180px] flex-shrink-0">
                <Image
                  src={resolveImageUrl(appLogo)}
                  alt="Admin Panel"
                  width={180}
                  height={40}
                  className="h-full w-auto object-contain"
                  priority
                />
              </div>
            ) : (
              <h1 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white truncate">
                Admin Panel
              </h1>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer relative ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white font-medium"
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
                {item.name === "Messages" && unreadCount > 0 && (
                  <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="px-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">
              Switch View
            </p>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all text-zinc-900 dark:text-white"
            >
              <Home size={16} />
              <span>Back to Shop</span>
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all cursor-pointer font-bold"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
