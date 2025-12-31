'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag, User, Search } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartCount, toggleCart } from '../../redux/features/cartSlice';
import { RootState } from '../../redux/store';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Redux Hooks
    const dispatch = useDispatch();
    const cartCount = useSelector(selectCartCount);
    // You can access user state here later
    // const { isAuthenticated, currentUser } = useSelector((state: RootState) => state.user);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleToggleCart = () => {
        dispatch(toggleCart());
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/80 backdrop-blur-md shadow-sm dark:bg-black/80'
                : 'bg-transparent'
                }`}
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
                    <nav className="hidden md:flex space-x-8">
                        <Link
                            href="/#new-arrivals"
                            className="text-sm font-medium text-zinc-700 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white"
                        >
                            New Arrivals
                        </Link>
                        {['Men', 'Women', 'Sale', 'About'].map((item) => (
                            <Link
                                key={item}
                                href={`/${item.toLowerCase().replace(' ', '-')}`}
                                className="text-sm font-medium text-zinc-700 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white"
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>

                    {/* Icons */}
                    <div className="hidden items-center space-x-6 md:flex">
                        <button className="text-zinc-700 transition-all hover:text-black hover:scale-110 cursor-pointer dark:text-zinc-300 dark:hover:text-white">
                            <Search className="h-5 w-5" />
                        </button>
                        <Link href="/login" className="text-zinc-700 transition-all hover:text-black hover:scale-110 cursor-pointer dark:text-zinc-300 dark:hover:text-white">
                            <User className="h-5 w-5" />
                        </Link>
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
            {isMobileMenuOpen && (
                <div className="md:hidden">
                    <div className="bg-white px-4 pb-6 pt-2 shadow-lg dark:bg-black">
                        <nav className="flex flex-col space-y-4">
                            {['New Arrivals', 'Men', 'Women', 'Sale', 'About'].map((item) => (
                                <Link
                                    key={item}
                                    href={`/${item.toLowerCase().replace(' ', '-')}`}
                                    className="text-lg font-medium text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item}
                                </Link>
                            ))}
                            <div className="flex items-center space-x-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <button className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300">
                                    <Search className="h-5 w-5" />
                                    <span>Search</span>
                                </button>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Link href="/login" className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300">
                                    <User className="h-5 w-5" />
                                    <span>Account</span>
                                </Link>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button onClick={handleToggleCart} className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300">
                                    <ShoppingBag className="h-5 w-5" />
                                    <span>Cart ({cartCount})</span>
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
