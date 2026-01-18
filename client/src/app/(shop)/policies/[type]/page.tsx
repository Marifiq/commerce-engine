"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/utils/api";
import { Policy } from "@/types";
import { LoadingSpinner } from "@/components/ui";
import { ArrowLeft, Package, DollarSign } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const policyTypeLabels: Record<string, string> = {
  refund: "Refund Policy",
  return: "Return Policy",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  shipping: "Shipping Policy",
};

export default function PolicyPage() {
  const params = useParams();
  const type = params?.type as string;
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    fetchPolicy();
  }, [type]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/policies/${type}`);
      setPolicy(res.data.policy);
    } catch (error: any) {
      console.error("Failed to fetch policy:", error);
      setError(error?.response?.data?.message || "Policy not found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Policy Not Found</h1>
          <p className="text-zinc-500 mb-6">{error || "The requested policy could not be found."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

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
            {policy.title || policyTypeLabels[type] || type}
          </h1>
          
          <div className="prose dark:prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-strong:text-black dark:prose-strong:text-white prose-ul:text-zinc-700 dark:prose-ul:text-zinc-300 prose-li:text-zinc-700 dark:prose-li:text-zinc-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {policy.content}
            </ReactMarkdown>
          </div>

          {/* Request Buttons for Return and Refund Policies */}
          {(type === "return" || type === "refund") && isAuthenticated && (
            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row gap-4">
                {type === "return" && (
                  <Link
                    href="/policies/return-request"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Package className="h-5 w-5" />
                    Request a Return
                  </Link>
                )}
                {type === "refund" && (
                  <Link
                    href="/policies/refund-request"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    <DollarSign className="h-5 w-5" />
                    Request a Refund
                  </Link>
                )}
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                {type === "return"
                  ? "Click the button above to submit a return request. Our team will review your request and get back to you within 2-3 business days."
                  : "Click the button above to submit a refund request. Our team will review your request and process it within 3-5 business days."}
              </p>
            </div>
          )}

          {!isAuthenticated && (type === "return" || type === "refund") && (
            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  You need to be logged in to request a {type === "return" ? "return" : "refund"}.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
                >
                  Sign In to Continue
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

