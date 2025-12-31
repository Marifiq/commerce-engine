import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-white px-4 text-center dark:bg-black">
            {/* Background decoration (optional subtle gradient or pattern) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-100 via-white to-white opacity-40 dark:from-zinc-900 dark:via-black dark:to-black"></div>

            <div className="relative z-10 mx-auto max-w-4xl space-y-8">
                <h1 className="text-5xl font-extrabold tracking-tighter text-black sm:text-7xl xl:text-8xl dark:text-white">
                    ELEVATE YOUR <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-900 dark:from-zinc-100 dark:to-zinc-500">
                        EVERYDAY STYLE
                    </span>
                </h1>

                <p className="mx-auto max-w-2xl text-lg font-light text-zinc-600 sm:text-xl dark:text-zinc-400">
                    Discover our curated collection of premium shirts. Meticulously crafted for the modern individual who values quality and timeless design.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                    <Link
                        href="/men"
                        className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-black px-8 text-base font-semibold text-white transition-all hover:bg-zinc-800 hover:scale-105 sm:w-auto dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                        Shop Collection
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                        href="/about"
                        className="flex h-14 w-full items-center justify-center rounded-full border border-zinc-200 px-8 text-base font-semibold text-black transition-all hover:border-black hover:bg-zinc-50 sm:w-auto dark:border-zinc-800 dark:text-white dark:hover:border-white dark:hover:bg-zinc-900"
                    >
                        View Lookbook
                    </Link>
                </div>
            </div>
        </section>
    );
}
