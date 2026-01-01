'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Send, ArrowRight, Mail, MapPin, Phone, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Footer() {
    const [email, setEmail] = useState('');
    const footerRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const bottomBarRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle newsletter subscription
        setEmail('');
    };

    useEffect(() => {
        if (footerRef.current) {
            const ctx = gsap.context(() => {
                // Animate main content
                if (contentRef.current) {
                    gsap.fromTo(
                        contentRef.current,
                        {
                            y: 60,
                            opacity: 0
                        },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 1,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: footerRef.current,
                                start: 'top 90%',
                                toggleActions: 'play none none reverse'
                            }
                        }
                    );
                }

                // Animate bottom bar
                if (bottomBarRef.current) {
                    gsap.fromTo(
                        bottomBarRef.current,
                        {
                            y: 30,
                            opacity: 0
                        },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.8,
                            ease: 'power3.out',
                            delay: 0.3,
                            scrollTrigger: {
                                trigger: footerRef.current,
                                start: 'top 90%',
                                toggleActions: 'play none none reverse'
                            }
                        }
                    );
                }
            });

            return () => {
                ctx.revert();
            };
        }
    }, []);

    const socialLinks = [
        { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-500' },
        { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-blue-500' },
        { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-sky-400' },
        { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:text-blue-600' },
    ];

    return (
        <footer ref={footerRef} className="relative bg-black text-zinc-300 overflow-hidden">
            <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                {/* Main Footer Content */}
                <div ref={contentRef} className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 mb-16">
                    {/* Brand & Description */}
                    <div className="space-y-6 lg:col-span-1">
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter text-white mb-3">
                                0x0ero<span className="text-zinc-500">.ic</span>
                            </h2>
                            <div className="h-1 w-20 bg-gradient-to-r from-white to-transparent mb-5" />
                        </div>
                        <p className="text-base leading-relaxed text-zinc-400 max-w-xs">
                            Premium shirts for the modern individual. Quality fabrics, perfect fit, and timeless designs tailored for you.
                        </p>
                        
                        {/* Contact Info */}
                        <div className="space-y-4 pt-5">
                            <div className="flex items-center gap-3 text-sm text-zinc-500 hover:text-white transition-colors group">
                                <Mail className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span>hello@0x0ero.ic</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-500 hover:text-white transition-colors group">
                                <Phone className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-500 hover:text-white transition-colors group">
                                <MapPin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span>New York, NY</span>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="pt-5">
                            <p className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-5">Follow Us</p>
                            <div className="flex gap-3">
                                {socialLinks.map((social, idx) => {
                                    const Icon = social.icon;
                                    return (
                                        <Link
                                            key={idx}
                                            href={social.href}
                                            className={`group relative p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 ${social.color} transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/10`}
                                            aria-label={social.label}
                                        >
                                            <Icon className="h-6 w-6" />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            <span className="h-0.5 w-10 bg-gradient-to-r from-white to-transparent" />
                            Shop
                        </h3>
                        <ul className="space-y-4">
                            {['New Arrivals', 'Men', 'Women', 'Accessories', 'Sale'].map((item, idx) => (
                                <li key={item}>
                                    <Link 
                                        href={`/${item.toLowerCase().replace(' ', '-')}`} 
                                        className="group flex items-center gap-2 text-base text-zinc-400 hover:text-white transition-all duration-300"
                                    >
                                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        <span className="group-hover:translate-x-1 transition-transform">{item}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h3 className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            <span className="h-0.5 w-10 bg-gradient-to-r from-white to-transparent" />
                            Support
                        </h3>
                        <ul className="space-y-4">
                            {['Contact Us', 'Shipping Policy', 'Returns & Exchanges', 'Size Guide', 'FAQs'].map((item) => (
                                <li key={item}>
                                    <Link 
                                        href="#" 
                                        className="group flex items-center gap-2 text-base text-zinc-400 hover:text-white transition-all duration-300"
                                    >
                                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        <span className="group-hover:translate-x-1 transition-transform">{item}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            <span className="h-0.5 w-10 bg-gradient-to-r from-white to-transparent" />
                            Newsletter
                        </h3>
                        <p className="mb-6 text-base leading-relaxed text-zinc-400">
                            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals delivered to your inbox.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full rounded-xl border-2 border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-5 py-4 pr-14 text-base text-white placeholder-zinc-500 focus:border-white focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-white text-black hover:bg-zinc-200 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg shadow-black/20"
                                    aria-label="Subscribe"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
                            </p>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div ref={bottomBarRef} className="pt-8 border-t border-zinc-800/50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-sm text-zinc-500 flex items-center gap-2">
                            <span>&copy; {new Date().getFullYear()} 0x0ero.ic, Inc.</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                                Made with <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" /> for style
                            </span>
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
                                Terms of Service
                            </Link>
                            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
                                Cookie Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
