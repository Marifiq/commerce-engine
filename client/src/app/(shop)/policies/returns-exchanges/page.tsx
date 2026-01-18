"use client";

import Link from "next/link";
import { ArrowLeft, Package, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";

export default function ReturnsExchangesPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-bold">Back to Home</span>
        </Link>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-6 text-black dark:text-white">
            Returns & Exchanges
          </h1>

          <div className="prose dark:prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-strong:text-black dark:prose-strong:text-white prose-ul:text-zinc-700 dark:prose-ul:text-zinc-300 prose-li:text-zinc-700 dark:prose-li:text-zinc-300">
            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
                Return Policy
              </h2>
              <p className="mb-4">
                We want you to be completely satisfied with your purchase. If you're not happy with your order, you can return it within 30 days of delivery for a full refund or exchange.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Return Window
              </h2>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Items must be returned within 30 days of delivery</li>
                <li>Items must be unworn, unwashed, and in original condition with tags attached</li>
                <li>Original packaging should be included when possible</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Eligible Items
              </h2>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Regular priced items</li>
                <li>Sale items (unless marked as final sale)</li>
                <li>Items with original tags and packaging</li>
                <li>Items that haven't been worn or washed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white flex items-center gap-2">
                <XCircle className="h-6 w-6" />
                Non-Returnable Items
              </h2>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Items marked as "Final Sale"</li>
                <li>Items that have been worn, washed, or damaged</li>
                <li>Items without original tags or packaging</li>
                <li>Custom or personalized items</li>
                <li>Items returned after 30 days</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white flex items-center gap-2">
                <RefreshCw className="h-6 w-6" />
                Exchange Policy
              </h2>
              <p className="mb-4">
                We're happy to exchange items for a different size or color, subject to availability. Exchanges follow the same guidelines as returns.
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Exchanges must be requested within 30 days of delivery</li>
                <li>Items must be in original condition with tags attached</li>
                <li>If the exchange item is more expensive, you'll pay the difference</li>
                <li>If the exchange item is less expensive, we'll refund the difference</li>
                <li>Exchanges are subject to item availability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white flex items-center gap-2">
                <Package className="h-6 w-6" />
                How to Return or Exchange
              </h2>
              <ol className="list-decimal pl-6 space-y-3 mb-4">
                <li>
                  <strong>Log in to your account</strong> and navigate to your orders
                </li>
                <li>
                  <strong>Select the item</strong> you want to return or exchange
                </li>
                <li>
                  <strong>Fill out the return form</strong> with your reason and preference (refund or exchange)
                </li>
                <li>
                  <strong>Print the return label</strong> we provide (if applicable) or use your own shipping method
                </li>
                <li>
                  <strong>Package the item</strong> securely in its original packaging with tags attached
                </li>
                <li>
                  <strong>Ship the package</strong> to our return address
                </li>
                <li>
                  <strong>Wait for processing</strong> - we'll process your return within 5-7 business days of receipt
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
                Refund Processing
              </h2>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Refunds will be issued to the original payment method</li>
                <li>Processing time: 5-7 business days after we receive your return</li>
                <li>Shipping costs are non-refundable unless the item was defective or incorrect</li>
                <li>You'll receive an email confirmation once your refund has been processed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
                Return Shipping
              </h2>
              <p className="mb-4">
                Customers are responsible for return shipping costs unless the item was defective, incorrect, or the return is due to our error. We may provide a prepaid return label in certain cases.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
                Need Help?
              </h2>
              <p className="mb-4">
                If you have questions about returns or exchanges, please{" "}
                <Link href="/policies/contact" className="text-black dark:text-white underline font-bold">
                  contact us
                </Link>
                {" "}and we'll be happy to assist you.
              </p>
            </section>

            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/policies/return-request"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                <Package className="h-5 w-5" />
                Request a Return or Exchange
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

