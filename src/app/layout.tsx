import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
// import { CartProvider } from "./context/CartContext"; // Removed in favor of Redux
import { Providers } from "./providers";
import CheckoutModal from "./components/CheckoutModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShirtStore - Premium Shirts",
  description: "Shop the best shirts online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-black`}
      >
        <Providers>
          <Header />
          <main className="min-h-screen pt-20">
            {children}
          </main>
          <CartSidebar />
          <CheckoutModal />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
