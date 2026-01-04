'use client';

import { lazy, Suspense } from 'react';
import { Header, Footer } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui";

// Lazy load heavy components for better initial load performance
const OfferBanner = lazy(() => 
  import("@/components/shop").then(module => ({ default: module.OfferBanner }))
);
const CartSidebar = lazy(() => 
  import("@/components/shop").then(module => ({ default: module.CartSidebar }))
);
const CheckoutModal = lazy(() => 
  import("@/components/shop").then(module => ({ default: module.CheckoutModal }))
);

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Suspense fallback={null}>
                <OfferBanner />
            </Suspense>
            <Header />
            <main className="min-h-screen pt-20">
                {children}
            </main>
            <Suspense fallback={null}>
                <CartSidebar />
            </Suspense>
            <Suspense fallback={null}>
                <CheckoutModal />
            </Suspense>
            <Footer />
        </>
    );
}
