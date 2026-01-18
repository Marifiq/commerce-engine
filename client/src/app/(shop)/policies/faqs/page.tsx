"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and other secure payment methods. All transactions are encrypted and secure."
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping typically takes 5-7 business days. Express shipping (2-3 business days) and overnight shipping options are also available at checkout. International shipping times vary by location. For more details, see our Shipping Policy."
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship to most countries worldwide. International shipping costs and delivery times vary by location. You can see available shipping options and costs at checkout."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy on most items. Items must be unworn, unwashed, and in original condition with tags attached. For full details, please visit our Returns & Exchanges page."
  },
  {
    question: "How do I track my order?",
    answer: "Once your order ships, you'll receive a tracking number via email. You can use this number to track your package on the carrier's website. You can also track your order by logging into your account and viewing your order history."
  },
  {
    question: "Can I cancel or modify my order?",
    answer: "Orders can be cancelled or modified within 24 hours of placement, as long as they haven't been shipped yet. Once an order has been processed and shipped, it cannot be cancelled, but you can return it following our return policy."
  },
  {
    question: "What if my item arrives damaged or defective?",
    answer: "If your item arrives damaged or defective, please contact us immediately with photos of the damage. We'll arrange for a replacement or full refund, including return shipping costs."
  },
  {
    question: "Do you offer exchanges?",
    answer: "Yes, we offer exchanges for different sizes or colors, subject to availability. Exchanges must be requested within 30 days of delivery and items must be in original condition. See our Returns & Exchanges page for details."
  },
  {
    question: "How do I find my size?",
    answer: "We provide detailed size charts for all products. Visit our Size Guide page for comprehensive measurement instructions and size conversion tables. If you're unsure, our customer service team can help you find the perfect fit."
  },
  {
    question: "Are your products true to size?",
    answer: "Our products are designed to fit true to size based on standard measurements. However, fit preferences can vary. We recommend checking our Size Guide and reading product reviews for fit information. If you're between sizes, we suggest sizing up."
  },
  {
    question: "What materials are your shirts made from?",
    answer: "We use high-quality materials including premium cotton, cotton blends, and performance fabrics. Specific material information is listed in each product's description. All materials are carefully selected for comfort, durability, and style."
  },
  {
    question: "How do I care for my shirt?",
    answer: "Care instructions are included with each product and on the garment's care label. Generally, we recommend machine washing in cold water, tumble drying on low, and ironing on medium heat if needed. Some items may require special care."
  },
  {
    question: "Do you have a physical store?",
    answer: "Currently, we operate as an online-only retailer. This allows us to offer competitive prices and a wide selection. However, we're always looking to expand, so check back for updates on physical store locations."
  },
  {
    question: "How can I contact customer service?",
    answer: "You can reach our customer service team via email, phone, or through our Contact Us page. We typically respond within 24 hours during business days. Our contact information is available in the footer of every page."
  },
  {
    question: "Do you offer gift wrapping?",
    answer: "Yes, we offer gift wrapping services for an additional fee. You can select this option at checkout. Gift-wrapped items come with a personalized message card."
  },
  {
    question: "Can I create an account?",
    answer: "Yes, creating an account is free and allows you to track orders, save your shipping addresses, view order history, and enjoy faster checkout. You can create an account during checkout or by visiting the Sign Up page."
  },
  {
    question: "What is your privacy policy?",
    answer: "We take your privacy seriously. We only collect information necessary to process your orders and improve your shopping experience. We never sell your personal information. For complete details, please review our Privacy Policy."
  },
  {
    question: "Do you have sales or discounts?",
    answer: "Yes, we regularly offer sales and discounts. Sign up for our newsletter to receive exclusive offers, or check our website for current promotions. You can also follow us on social media for the latest deals."
  },
  {
    question: "What is your refund policy?",
    answer: "Refunds are processed within 5-7 business days after we receive your return. The refund will be issued to your original payment method. Shipping costs are non-refundable unless the return is due to our error. See our Refund Policy for complete details."
  }
];

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
            Frequently Asked Questions
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Find answers to common questions about our products, shipping, returns, and more. Can't find what you're looking for?{" "}
            <Link href="/policies/contact" className="text-black dark:text-white underline font-bold">
              Contact us
            </Link>
            {" "}and we'll be happy to help.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="font-bold text-black dark:text-white pr-4">
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-zinc-600 dark:text-zinc-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-zinc-600 dark:text-zinc-400 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
              Still Have Questions?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We're here to help! Reach out to our customer service team and we'll get back to you as soon as possible.
            </p>
            <Link
              href="/policies/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

