'use client';

import Header from "../components/Header";
import Footer from "../components/Footer";
import CartSidebar from "../components/CartSidebar";
import CheckoutModal from "../components/CheckoutModal";
import OfferBanner from "../components/OfferBanner";


export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <OfferBanner />
            <Header />
            <main className="min-h-screen pt-20">
                {children}
            </main>
            <CartSidebar />
            <CheckoutModal />
            <Footer />
        </>
    );
}
