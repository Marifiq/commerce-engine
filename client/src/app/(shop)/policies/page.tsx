"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/utils/api";
import { Policy } from "@/types/policy";
import { LoadingSpinner } from "@/components/ui";
import { FileText, Package, DollarSign, Shield, Truck, Scale, HelpCircle, Mail, Headphones, BookOpen, Ruler } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const policyTypeLabels: Record<string, string> = {
  refund: "Refund Policy",
  return: "Return Policy",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  shipping: "Shipping Policy",
  faqs: "Frequently Asked Questions",
  contact: "Contact Us",
  support: "Support",
  guides: "Guides",
  "size-guide": "Size Guide",
};

const policyIcons: Record<string, any> = {
  refund: DollarSign,
  return: Package,
  terms: Scale,
  privacy: Shield,
  shipping: Truck,
  faqs: HelpCircle,
  contact: Mail,
  support: Headphones,
  guides: BookOpen,
  "size-guide": Ruler,
  "returns-exchanges": Package,
};

// Static policy links that have dedicated pages
const staticPolicies = [
  { type: "faqs", label: "Frequently Asked Questions", href: "/policies/faqs", icon: HelpCircle },
  { type: "contact", label: "Contact Us", href: "/policies/contact", icon: Mail },
  { type: "support", label: "Support", href: "/policies/contact", icon: Headphones },
  { type: "size-guide", label: "Size Guide", href: "/policies/size-guide", icon: Ruler },
  { type: "returns-exchanges", label: "Returns & Exchanges", href: "/policies/returns-exchanges", icon: Package },
];

export default function PoliciesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedType = searchParams.get("type") || null;
  
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    if (policies.length > 0) {
      if (selectedType) {
        const policy = policies.find((p) => p.type === selectedType);
        if (policy) {
          setSelectedPolicy(policy);
        } else {
          // If selected type not found, select first policy
          setSelectedPolicy(policies[0]);
          router.replace("/policies?type=" + policies[0].type);
        }
      } else {
        // If no type selected, select first policy
        setSelectedPolicy(policies[0]);
        router.replace("/policies?type=" + policies[0].type);
      }
    }
  }, [policies, selectedType, router]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/policies`);
      setPolicies(res.data.policies || []);
    } catch (error: any) {
      console.error("Failed to fetch policies:", error);
      setError(error?.response?.data?.message || "Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const handlePolicySelect = (policy: Policy) => {
    setSelectedPolicy(policy);
    router.push(`/policies?type=${policy.type}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-black">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || policies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-black p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">
            {error || "No Policies Available"}
          </h1>
          <p className="text-zinc-500 mb-6">
            {error || "There are no policies available at this time."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-black dark:text-white mb-2">
            Policies & Information
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Review our policies and terms to understand your rights and our commitments
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sticky top-24">
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4 px-2">
                Navigate Policies
              </h2>
              <nav className="space-y-2">
                {/* Database policies from admin */}
                {policies.map((policy) => {
                  const Icon = policyIcons[policy.type] || FileText;
                  const isActive = selectedPolicy?.type === policy.type;
                  
                  return (
                    <button
                      key={policy.id}
                      onClick={() => handlePolicySelect(policy)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-black dark:bg-white text-white dark:text-black font-semibold shadow-sm"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "" : "text-zinc-500 dark:text-zinc-400"}`} />
                      <span className="text-sm font-medium">
                        {policy.title || policyTypeLabels[policy.type] || policy.type}
                      </span>
                    </button>
                  );
                })}
                
                {/* Static policy links (FAQs, Contact, Support, Size Guide, Returns & Exchanges) */}
                {staticPolicies
                  .filter((staticPolicy) => !policies.some((p) => p.type === staticPolicy.type))
                  .map((staticPolicy) => {
                    const Icon = staticPolicy.icon;
                    const isActive = false; // Static policies navigate to separate pages
                    
                    return (
                      <Link
                        key={staticPolicy.type}
                        href={staticPolicy.href}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
                          isActive
                            ? "bg-black dark:bg-white text-white dark:text-black font-semibold shadow-sm"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "" : "text-zinc-500 dark:text-zinc-400"}`} />
                        <span className="text-sm font-medium">
                          {staticPolicy.label}
                        </span>
                      </Link>
                    );
                  })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {selectedPolicy ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-6">
                  {(() => {
                    const Icon = policyIcons[selectedPolicy.type] || FileText;
                    return <Icon className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />;
                  })()}
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black dark:text-white">
                    {selectedPolicy.title || policyTypeLabels[selectedPolicy.type] || selectedPolicy.type}
                  </h1>
                </div>
                
                <div 
                  className="prose dark:prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-strong:text-black dark:prose-strong:text-white prose-ul:text-zinc-700 dark:prose-ul:text-zinc-300 prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-a:text-black dark:prose-a:text-white prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: selectedPolicy.content }}
                />

                {/* Request Buttons for Return and Refund Policies */}
                {(selectedPolicy.type === "return" || selectedPolicy.type === "refund") && isAuthenticated && (
                  <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {selectedPolicy.type === "return" && (
                        <a
                          href="/policies/return-request"
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        >
                          <Package className="h-5 w-5" />
                          Request a Return
                        </a>
                      )}
                      {selectedPolicy.type === "refund" && (
                        <a
                          href="/policies/refund-request"
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        >
                          <DollarSign className="h-5 w-5" />
                          Request a Refund
                        </a>
                      )}
                    </div>
                    <p className="mt-4 text-sm text-zinc-500">
                      {selectedPolicy.type === "return"
                        ? "Click the button above to submit a return request. Our team will review your request and get back to you within 2-3 business days."
                        : "Click the button above to submit a refund request. Our team will review your request and process it within 3-5 business days."}
                    </p>
                  </div>
                )}

                {!isAuthenticated && (selectedPolicy.type === "return" || selectedPolicy.type === "refund") && (
                  <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                        You need to be logged in to request a {selectedPolicy.type === "return" ? "return" : "refund"}.
                      </p>
                      <a
                        href="/login"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
                      >
                        Sign In to Continue
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 text-center">
                <p className="text-zinc-500">Select a policy from the sidebar to view its content.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

