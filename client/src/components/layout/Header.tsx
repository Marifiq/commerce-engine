"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, User, Search, LogOut } from "lucide-react";
import Avatar from "@/components/common/Avatar";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/hooks/useRedux";
import { selectCartCount, toggleCart } from "@/store/features/cart";
import { logout } from "@/store/features/auth";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/store";
import { siteConfig } from "@/lib/config/site";
import { useAppName, useAppLogo } from "@/hooks/useSettings";
import { resolveImageUrl } from "@/lib/utils/imageUtils";
import Image from "next/image";
import { useToast } from "@/contexts";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { appName } = useAppName();
  const { appLogo } = useAppLogo();

  // Redux Hooks
  const dispatch = useAppDispatch();
  const router = useRouter();
  const cartCount = useSelector(selectCartCount);
  const { showToast } = useToast();
  // You can access user state here later
  const { isAuthenticated, currentUser } = useSelector(
    (state: RootState) => state.user
  );

  // Set mounted state on client-side only to prevent hydration issues
  // This is a valid pattern for Next.js client components
  useEffect(() => {
    setMounted(true);
    // eslint-disable-next-line react-compiler/react-compiler
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  const handleToggleCart = () => {
    dispatch(toggleCart());
  };

  const handleLogout = () => {
    dispatch(logout());
    showToast("You have been logged out", "success");
    router.push("/");
  };

  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    e.preventDefault();
    const currentPath = window.location.pathname;

    if (currentPath === "/") {
      // If on home page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        const headerHeight = 80; // Height of fixed header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    } else {
      // If not on home page, navigate to home with anchor
      // The home page useEffect will handle the scrolling
      router.push(`/#${sectionId}`);
    }

    // Close mobile menu if open
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/80 backdrop-blur-lg shadow-[0_1px_3px_rgba(255,255,255,0.08)] border-b border-zinc-800/50"
          : "bg-transparent"
      }`}
      id="main-header"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer">
            <Link
              href="/"
              className="flex items-center gap-2 transition-colors"
            >
              {appLogo ? (
                <div className="relative h-10 w-auto max-w-[200px]">
                  <Image
                    src={resolveImageUrl(appLogo)}
                    alt={appName || siteConfig.header.logo.text}
                    width={200}
                    height={40}
                    className="h-full w-auto object-contain"
                    priority
                  />
                </div>
              ) : (
                <span className="text-2xl font-bold tracking-tighter text-white">
                  {appName || siteConfig.header.logo.text}
                  <span className="text-zinc-400">
                    {siteConfig.header.logo.suffix}
                  </span>
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {siteConfig.header.navigation.map((item) => {
              if (item.type === "link") {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) =>
                    handleSectionClick(e, item.href.replace("#", ""))
                  }
                  className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-white cursor-pointer"
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Icons */}
          <div className="hidden items-center space-x-6 md:flex">
            {/* Admin Toggle */}
            {mounted && isAuthenticated && currentUser?.role === "admin" && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all shadow-sm"
              >
                {siteConfig.header.buttons.adminPanel}
              </Link>
            )}

            <button className="text-zinc-400 transition-all hover:text-white hover:scale-110 cursor-pointer">
              <Search className="h-5 w-5" />
            </button>

            {/* Auth Buttons */}
            {mounted && isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="text-zinc-400 transition-all hover:text-white hover:scale-110 cursor-pointer"
                  title="Profile"
                >
                  <Avatar user={currentUser} size="sm" />
                </Link>
                <Link
                  href="/orders"
                  className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                >
                  {siteConfig.header.buttons.myOrders}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-zinc-400 transition-all hover:text-white hover:scale-110 cursor-pointer"
                  title={siteConfig.header.buttons.logout}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                <Link
                  href="/login"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {siteConfig.header.buttons.signIn}
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-all shadow-sm"
                >
                  {siteConfig.header.buttons.signUp}
                </Link>
              </div>
            )}
            <button
              onClick={handleToggleCart}
              className="relative text-zinc-400 transition-all hover:text-white hover:scale-110 cursor-pointer"
            >
              <ShoppingBag className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-black shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-zinc-400 hover:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="bg-black px-4 pb-6 pt-2 shadow-xl border-t border-zinc-800">
            <nav className="flex flex-col space-y-4">
              {siteConfig.header.navigation.map((item) => {
                if (item.type === "link") {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="text-xl font-black uppercase tracking-tighter text-zinc-400 hover:text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      handleSectionClick(e, item.href.replace("#", ""));
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-xl font-black uppercase tracking-tighter text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {item.label}
                  </a>
                );
              })}
              <div className="flex items-center justify-center pt-4 border-t border-zinc-800">
                <button className="flex items-center space-x-2 text-zinc-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors">
                  <Search className="h-5 w-5" />
                  <span>{siteConfig.header.buttons.search}</span>
                </button>
              </div>
              <div className="flex items-center space-x-4 pt-4 border-t border-zinc-800">
                {isAuthenticated ? (
                  <div className="flex flex-col space-y-3 w-full">
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 text-zinc-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 text-zinc-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      <span>{siteConfig.header.buttons.myOrders}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 text-white w-full font-bold uppercase tracking-widest text-xs"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>{siteConfig.header.buttons.logout}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3 w-full">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 text-zinc-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span>{siteConfig.header.buttons.signIn}</span>
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-xs shadow-sm"
                    >
                      {siteConfig.header.buttons.signUp}
                    </Link>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleToggleCart}
                  className="flex items-center space-x-2 text-zinc-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>
                    {siteConfig.header.buttons.cart} ({cartCount})
                  </span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
