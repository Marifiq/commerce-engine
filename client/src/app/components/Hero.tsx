'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';

export default function Hero() {
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof gsap === 'undefined') return;

        // Create GSAP context for proper cleanup
        const ctx = gsap.context(() => {
            // Reset all styles first to prevent stuck animations
            if (bgRef.current) {
                gsap.set(bgRef.current, { clearProps: 'all' });
                gsap.set(bgRef.current, { opacity: 0 });
            }
            if (titleRef.current) {
                gsap.set(titleRef.current, { clearProps: 'all' });
                gsap.set(titleRef.current, { y: 60, opacity: 0 });
            }
            if (subtitleRef.current) {
                gsap.set(subtitleRef.current, { clearProps: 'all' });
                gsap.set(subtitleRef.current, { y: 40, opacity: 0 });
            }
            if (buttonsRef.current) {
                Array.from(buttonsRef.current.children).forEach((child) => {
                    const element = child as HTMLElement;
                    gsap.set(element, { clearProps: 'all' });
                    gsap.set(element, { opacity: 0, y: 30 });
                });
            }

            // Animate background
            if (bgRef.current) {
                gsap.to(bgRef.current, {
                    opacity: 1,
                    duration: 1.2,
                    ease: 'power2.out'
                });
            }

            // Animate title
            if (titleRef.current) {
                gsap.to(titleRef.current, {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: 'power3.out',
                    delay: 0.2
                });
            }

            // Animate subtitle
            if (subtitleRef.current) {
                gsap.to(subtitleRef.current, {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: 'power3.out',
                    delay: 0.4
                });
            }

            // Animate buttons
            if (buttonsRef.current) {
                gsap.to(buttonsRef.current.children, {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: 'power3.out',
                    delay: 0.6
                });
            }
        });

        // Cleanup function to revert all GSAP changes
        return () => {
            ctx.revert();
        };
    }, []);

    return (
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-white px-4 text-center dark:bg-black">
            {/* Background decoration (optional subtle gradient or pattern) */}
            <div ref={bgRef} className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-zinc-100 via-white to-white opacity-40 dark:from-zinc-900 dark:via-black dark:to-black"></div>

            <div className="relative z-10 mx-auto max-w-4xl space-y-8">
                <h1 ref={titleRef} className="text-5xl font-extrabold tracking-tighter text-black sm:text-7xl xl:text-8xl dark:text-white">
                    STYLE MEETS <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-500 to-zinc-900 dark:from-zinc-100 dark:to-zinc-500">
                        SUBSTANCE
                    </span>
                </h1>

                <p ref={subtitleRef} className="mx-auto max-w-2xl text-lg font-light text-zinc-600 sm:text-xl dark:text-zinc-400">
                    Premium quality shirts that blend comfort, durability, and timeless style. Find your perfect fit.
                </p>

                <div ref={buttonsRef} className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                    <Link
                        href="/shop"
                        className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-black px-8 text-base font-semibold text-white transition-all duration-300 hover:bg-zinc-800 hover:scale-105 active:scale-95 sm:w-auto dark:bg-white dark:text-black dark:hover:bg-zinc-200 cursor-pointer opacity-100"
                        style={{ visibility: 'visible' }}
                    >
                        Shop Now
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                    <Link
                        href="/shop?off=true"
                        className="group flex h-14 w-full items-center justify-center gap-2 rounded-full border border-zinc-200 px-8 text-base font-semibold text-black transition-all duration-300 hover:border-black hover:bg-zinc-50 sm:w-auto dark:border-zinc-800 dark:text-white dark:hover:border-white dark:hover:bg-zinc-900 cursor-pointer opacity-100"
                        style={{ visibility: 'visible' }}
                    >
                        Offers
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
