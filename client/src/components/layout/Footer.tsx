'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Send, ArrowRight, Mail, MapPin, Phone, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { siteConfig } from '@/lib/config/site';
import { useAppName, useAppLogo } from '@/hooks/useSettings';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import Image from 'next/image';
import { useToast } from '@/contexts';
import { apiFetch } from '@/lib/utils/api';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
};

export default function Footer() {
    const [email, setEmail] = useState('');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const footerRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const bottomBarRef = useRef<HTMLDivElement>(null);
    const { appName } = useAppName();
    const { appLogo } = useAppLogo();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim()) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        setIsSubscribing(true);
        try {
            await apiFetch('/newsletter/subscribe', {
                method: 'POST',
                body: { email: email.trim() },
                showError: false, // We'll handle errors manually
            });
            showToast('Successfully subscribed to newsletter!', 'success');
            setEmail('');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe to newsletter';
            // Check if it's a duplicate subscription (409 or similar)
            if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('exists')) {
                showToast('You are already subscribed to our newsletter', 'info');
            } else {
                showToast(errorMessage, 'error');
            }
        } finally {
            setIsSubscribing(false);
        }
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

    const socialLinks = siteConfig.footer.social.links.map((social) => ({
        icon: iconMap[social.icon],
        href: social.href,
        label: social.name,
        color: social.color,
    }));

    return (
        <footer ref={footerRef} className="relative bg-black text-zinc-300 overflow-hidden">
            <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                {/* Main Footer Content */}
                <div ref={contentRef} className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 mb-16">
                    {/* Brand & Description */}
                    <div className="space-y-6 lg:col-span-1">
                        <div>
                            {appLogo ? (
                                <div className="mb-5">
                                    <div className="relative h-16 w-auto max-w-[250px] mb-3">
                                        <Image
                                            src={resolveImageUrl(appLogo)}
                                            alt={appName || siteConfig.footer.brand.name}
                                            width={250}
                                            height={64}
                                            className="h-full w-auto object-contain"
                                        />
                                    </div>
                                    <div className="h-1 w-20 bg-gradient-to-r from-white to-transparent mb-5" />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-4xl font-black tracking-tighter text-white mb-3">
                                        {appName || siteConfig.footer.brand.name}
                                        <span className="text-zinc-500">{siteConfig.footer.brand.suffix}</span>
                                    </h2>
                                    <div className="h-1 w-20 bg-gradient-to-r from-white to-transparent mb-5" />
                                </>
                            )}
                        </div>
                        <p className="text-base leading-relaxed text-zinc-400 max-w-xs">
                            {siteConfig.footer.brand.description}
                        </p>
                        
                        {/* Contact Info */}
                        <div className="space-y-4 pt-5">
                            <div className="flex items-center gap-3 text-sm text-zinc-500 hover:text-white transition-colors group">
                                <Mail className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span>{siteConfig.footer.contact.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-500 hover:text-white transition-colors group">
                                <Phone className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span>{siteConfig.footer.contact.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-500 hover:text-white transition-colors group">
                                <MapPin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span>{siteConfig.footer.contact.address}</span>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="pt-5">
                            <p className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-5">{siteConfig.footer.social.title}</p>
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
                            {siteConfig.footer.quickLinks.title}
                        </h3>
                        <ul className="space-y-4">
                            {siteConfig.footer.quickLinks.items.map((item) => (
                                <li key={item.label}>
                                    <Link 
                                        href={item.href} 
                                        className="group flex items-center gap-2 text-base text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
                                    >
                                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h3 className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            <span className="h-0.5 w-10 bg-gradient-to-r from-white to-transparent" />
                            {siteConfig.footer.support.title}
                        </h3>
                        <ul className="space-y-4">
                            {siteConfig.footer.support.items.map((item) => (
                                <li key={item.label}>
                                    <Link 
                                        href={item.href} 
                                        className="group flex items-center gap-2 text-base text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
                                    >
                                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            <span className="h-0.5 w-10 bg-gradient-to-r from-white to-transparent" />
                            {siteConfig.footer.newsletter.title}
                        </h3>
                        <p className="mb-6 text-base leading-relaxed text-zinc-400">
                            {siteConfig.footer.newsletter.description}
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={siteConfig.footer.newsletter.placeholder}
                                    className="w-full rounded-xl border-2 border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-5 py-4 pr-14 text-base text-white placeholder-zinc-500 focus:border-white focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isSubscribing}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-white text-black hover:bg-zinc-200 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    aria-label="Subscribe"
                                >
                                    <Send className={`h-5 w-5 ${isSubscribing ? 'animate-pulse' : ''}`} />
                                </button>
                            </div>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                {siteConfig.footer.newsletter.privacyNote}
                            </p>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div ref={bottomBarRef} className="pt-8 border-t border-zinc-800/50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-sm text-zinc-500 flex items-center gap-2">
                            <span>© {new Date().getFullYear()} {appName || siteConfig.footer.brand.name}{siteConfig.footer.brand.suffix}, Inc.</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                                {siteConfig.footer.bottomBar.madeWith} <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" /> {siteConfig.footer.bottomBar.madeWithText}
                            </span>
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                            {siteConfig.footer.bottomBar.policies.map((policy) => (
                                <Link key={policy.label} href={policy.href} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                                    {policy.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
