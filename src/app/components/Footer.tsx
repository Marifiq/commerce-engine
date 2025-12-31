import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Send } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-zinc-950 text-zinc-300">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">

                    {/* Brand & Description */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold tracking-tighter text-white">
                            0x0ero<span className="text-zinc-500">.ic</span>
                        </h2>
                        <p className="text-sm leading-6 text-zinc-400">
                            Premium shirts for the modern individual. Quality fabrics, perfect fit, and timeless designs tailored for you.
                        </p>
                        <div className="flex space-x-4">
                            <Link href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Shop</h3>
                        <ul className="space-y-3">
                            {['New Arrivals', 'Men', 'Women', 'Accessories', 'Sale'].map((item) => (
                                <li key={item}>
                                    <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm hover:text-white transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Support</h3>
                        <ul className="space-y-3">
                            {['Contact Us', 'Shipping Policy', 'Returns & Exchanges', 'Size Guide', 'FAQs'].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-sm hover:text-white transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Newsletter</h3>
                        <p className="mb-4 text-sm text-zinc-400">
                            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
                        </p>
                        <form className="flex flex-col space-y-2">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-white focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-white transition-all"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1 top-1  rounded bg-white p-1 text-black hover:bg-zinc-200 transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="mt-12 border-t border-zinc-800 pt-8 text-center">
                    <p className="text-xs text-zinc-500">
                        &copy; {new Date().getFullYear()} 0x0ero.ic, Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
