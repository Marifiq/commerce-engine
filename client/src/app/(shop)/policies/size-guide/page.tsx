"use client";

import Link from "next/link";
import { ArrowLeft, Ruler } from "lucide-react";

export default function SizeGuidePage() {
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
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-6 text-black dark:text-white flex items-center gap-3">
            <Ruler className="h-8 w-8" />
            Size Guide
          </h1>

          <div className="prose dark:prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-strong:text-black dark:prose-strong:text-white prose-table:text-zinc-700 dark:prose-table:text-zinc-300">
            <section className="mb-8">
              <p className="mb-6">
                Finding the perfect fit is essential for comfort and style. Use our size guide below to determine your ideal size. All measurements are in inches.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
                How to Measure
              </h2>
              <ol className="list-decimal pl-6 space-y-3 mb-6">
                <li>
                  <strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape measure horizontal
                </li>
                <li>
                  <strong>Waist:</strong> Measure around your natural waistline, typically the narrowest part of your torso
                </li>
                <li>
                  <strong>Hips:</strong> Measure around the fullest part of your hips
                </li>
                <li>
                  <strong>Shoulder:</strong> Measure from the edge of one shoulder to the edge of the other
                </li>
                <li>
                  <strong>Sleeve Length:</strong> Measure from the center back of your neck, over your shoulder, and down to your wrist
                </li>
              </ol>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                Tip: Have someone help you measure for the most accurate results. Wear form-fitting clothing when measuring.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
                Men's Shirt Sizes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr className="border-b-2 border-zinc-300 dark:border-zinc-700">
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">Size</th>
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">Chest (inches)</th>
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">Waist (inches)</th>
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">Sleeve Length (inches)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">XS</td>
                      <td className="py-3 px-4">32-34</td>
                      <td className="py-3 px-4">26-28</td>
                      <td className="py-3 px-4">32-33</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">S</td>
                      <td className="py-3 px-4">35-37</td>
                      <td className="py-3 px-4">29-31</td>
                      <td className="py-3 px-4">33-34</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">M</td>
                      <td className="py-3 px-4">38-40</td>
                      <td className="py-3 px-4">32-34</td>
                      <td className="py-3 px-4">34-35</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">L</td>
                      <td className="py-3 px-4">41-43</td>
                      <td className="py-3 px-4">35-37</td>
                      <td className="py-3 px-4">35-36</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">XL</td>
                      <td className="py-3 px-4">44-46</td>
                      <td className="py-3 px-4">38-40</td>
                      <td className="py-3 px-4">36-37</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">2XL</td>
                      <td className="py-3 px-4">47-49</td>
                      <td className="py-3 px-4">41-43</td>
                      <td className="py-3 px-4">37-38</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-black dark:text-white">3XL</td>
                      <td className="py-3 px-4">50-52</td>
                      <td className="py-3 px-4">44-46</td>
                      <td className="py-3 px-4">38-39</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
                Women's Shirt Sizes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr className="border-b-2 border-zinc-300 dark:border-zinc-700">
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">Size</th>
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">Chest (inches)</th>
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">Waist (inches)</th>
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">Sleeve Length (inches)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">XS</td>
                      <td className="py-3 px-4">30-32</td>
                      <td className="py-3 px-4">24-26</td>
                      <td className="py-3 px-4">30-31</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">S</td>
                      <td className="py-3 px-4">33-35</td>
                      <td className="py-3 px-4">27-29</td>
                      <td className="py-3 px-4">31-32</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">M</td>
                      <td className="py-3 px-4">36-38</td>
                      <td className="py-3 px-4">30-32</td>
                      <td className="py-3 px-4">32-33</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">L</td>
                      <td className="py-3 px-4">39-41</td>
                      <td className="py-3 px-4">33-35</td>
                      <td className="py-3 px-4">33-34</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">XL</td>
                      <td className="py-3 px-4">42-44</td>
                      <td className="py-3 px-4">36-38</td>
                      <td className="py-3 px-4">34-35</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-black dark:text-white">2XL</td>
                      <td className="py-3 px-4">45-47</td>
                      <td className="py-3 px-4">39-41</td>
                      <td className="py-3 px-4">35-36</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
                Fit Guide
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h3 className="font-bold text-black dark:text-white mb-2">Regular Fit</h3>
                  <p className="text-sm">
                    Our standard fit - comfortable with a relaxed silhouette. Perfect for everyday wear.
                  </p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h3 className="font-bold text-black dark:text-white mb-2">Slim Fit</h3>
                  <p className="text-sm">
                    A more tailored fit that follows your body's contours. Great for a modern, polished look.
                  </p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h3 className="font-bold text-black dark:text-white mb-2">Oversized Fit</h3>
                  <p className="text-sm">
                    A relaxed, roomy fit for a comfortable, casual style. Consider sizing down if you prefer a more fitted look.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
                Size Conversion
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr className="border-b-2 border-zinc-300 dark:border-zinc-700">
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">US</th>
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">UK</th>
                      <th className="text-left py-3 px-4 font-black text-black dark:text-white">EU</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">XS</td>
                      <td className="py-3 px-4">XS</td>
                      <td className="py-3 px-4">32</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">S</td>
                      <td className="py-3 px-4">S</td>
                      <td className="py-3 px-4">36</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">M</td>
                      <td className="py-3 px-4">M</td>
                      <td className="py-3 px-4">40</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">L</td>
                      <td className="py-3 px-4">L</td>
                      <td className="py-3 px-4">44</td>
                    </tr>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-3 px-4 font-bold text-black dark:text-white">XL</td>
                      <td className="py-3 px-4">XL</td>
                      <td className="py-3 px-4">48</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-black dark:text-white">2XL</td>
                      <td className="py-3 px-4">2XL</td>
                      <td className="py-3 px-4">52</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black dark:text-white">
                Still Unsure?
              </h2>
              <p className="mb-4">
                If you're between sizes, we recommend sizing up for a more comfortable fit. Remember, you can always exchange your item if the size isn't quite right. Check out our{" "}
                <Link href="/policies/returns-exchanges" className="text-black dark:text-white underline font-bold">
                  Returns & Exchanges
                </Link>
                {" "}policy for more information.
              </p>
              <p>
                Need personalized sizing advice?{" "}
                <Link href="/policies/contact" className="text-black dark:text-white underline font-bold">
                  Contact us
                </Link>
                {" "}and our team will be happy to help you find your perfect fit.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

