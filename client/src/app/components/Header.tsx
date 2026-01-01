'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag, User, Search, LayoutDashboard, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartCount, toggleCart } from '../../redux/features/cartSlice';
import { logout } from '../../redux/features/userSlice';
import { useRouter } from 'next/navigation';
import { RootState } from '../../redux/store';
import { apiFetch } from '../../utils/api';
import { Offer } from '../../types';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    // Redux Hooks
    const dispatch = useDispatch();
    const router = useRouter();
    const cartCount = useSelector(selectCartCount);
    // You can access user state here later
    const { isAuthenticated, currentUser } = useSelector((state: RootState) => state.user);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        const fetchCategories = async () => {
            try {
                const res = await apiFetch('/categories');
                setCategories(res.data.data.slice(0, 4)); // Only show top 4 in header
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleToggleCart = () => {
        dispatch(toggleCart());
    };

    const handleLogout = () => {
        dispatch(logout());
        router.push('/');
    };

    const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        const currentPath = window.location.pathname;
        
        if (currentPath === '/') {
            // If on home page, scroll to section
            const element = document.getElementById(sectionId);
            if (element) {
                const headerHeight = 80; // Height of fixed header
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
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
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/80 backdrop-blur-md shadow-sm dark:bg-black/80'
                : 'bg-transparent'
                }`}
            id="main-header"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    {/* Logo */}
                    <div className="flex-shrink-0 cursor-pointer">
                        <Link href="/" className="text-2xl font-bold tracking-tighter text-black dark:text-white">
                            0x0ero<span className="text-zinc-500">.ic</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/shop"
                            className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
                        >
                            Category
                        </Link>
                        <a
                            href="#off"
                            onClick={(e) => handleSectionClick(e, 'off')}
                            className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                        >
                            Off
                        </a>
                        <a
                            href="#new-arrivals"
                            onClick={(e) => handleSectionClick(e, 'new-arrivals')}
                            className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                        >
                            New Arrivals
                        </a>
                        <a
                            href="#best-sellers"
                            onClick={(e) => handleSectionClick(e, 'best-sellers')}
                            className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                        >
                            Best Sellers
                        </a>
                    </nav>



                    {/* Icons */}
                    <div className="hidden items-center space-x-6 md:flex">
                        {/* Admin Toggle */}
                        {mounted && isAuthenticated && currentUser?.role === 'admin' && (
                            <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black dark:border-white text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                            >
                                Admin Panel
                            </Link>
                        )}

                        <button className="text-zinc-700 transition-all hover:text-black hover:scale-110 cursor-pointer dark:text-zinc-300 dark:hover:text-white">
                            <Search className="h-5 w-5" />
                        </button>

                        {/* Auth Buttons */}
                        {mounted && isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/orders"
                                    className="text-xs font-black uppercase tracking-widest text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white transition-colors"
                                >
                                    My Orders
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-zinc-700 transition-all hover:text-black hover:scale-110 cursor-pointer dark:text-zinc-300 dark:hover:text-white"
                                    title="Logout"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                <Link href="/login" className="text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white transition-colors">
                                    Sign In
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                        <button
                            onClick={handleToggleCart}
                            className="relative text-zinc-700 transition-all hover:text-black hover:scale-110 cursor-pointer dark:text-zinc-300 dark:hover:text-white"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white dark:bg-white dark:text-black">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {
                isMobileMenuOpen && (
                    <div className="md:hidden">
                        <div className="bg-white px-4 pb-6 pt-2 shadow-xl dark:bg-black border-t border-zinc-100 dark:border-zinc-800">
                            <nav className="flex flex-col space-y-4">
                                <Link
                                    href="/shop"
                                    className="text-xl font-black uppercase tracking-tighter text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Category
                                </Link>
                                <a
                                    href="#off"
                                    onClick={(e) => handleSectionClick(e, 'off')}
                                    className="text-xl font-black uppercase tracking-tighter text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white cursor-pointer"
                                >
                                    Off
                                </a>
                                <a
                                    href="#new-arrivals"
                                    onClick={(e) => handleSectionClick(e, 'new-arrivals')}
                                    className="text-xl font-black uppercase tracking-tighter text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white cursor-pointer"
                                >
                                    New Arrivals
                                </a>
                                <a
                                    href="#best-sellers"
                                    onClick={(e) => handleSectionClick(e, 'best-sellers')}
                                    className="text-xl font-black uppercase tracking-tighter text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white cursor-pointer"
                                >
                                    Best Sellers
                                </a>
                                <div className="flex items-center space-x-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <button className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-widest text-xs">
                                        <Search className="h-5 w-5" />
                                        <span>Search</span>
                                    </button>
                                </div>
                                <div className="flex items-center space-x-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    {isAuthenticated ? (
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="flex items-center space-x-2 text-black dark:text-white w-full font-bold uppercase tracking-widest text-xs"
                                        >
                                            <LogOut className="h-5 w-5" />
                                            <span>Logout</span>
                                        </button>
                                    ) : (
                                        <div className="flex flex-col space-y-3 w-full">
                                            <Link
                                                href="/login"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-widest text-xs"
                                            >
                                                <User className="h-5 w-5" />
                                                <span>Sign In</span>
                                            </Link>
                                            <Link
                                                href="/signup"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="flex items-center justify-center w-full px-4 py-2 rounded-xl bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-black uppercase tracking-widest text-xs"
                                            >
                                                Sign Up
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-4">
                                    <button onClick={handleToggleCart} className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-widest text-xs">
                                        <ShoppingBag className="h-5 w-5" />
                                        <span>Cart ({cartCount})</span>
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </div>
                )
            }
        </header >
    );
}
