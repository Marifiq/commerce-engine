"use client";

import { useEffect, useRef, lazy, Suspense } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui";

// Lazy load heavy components for better performance
const CategorySection = lazy(() => 
  import("@/components/shop").then(module => ({ default: module.CategorySection }))
);
const NewArrivals = lazy(() => 
  import("@/components/shop").then(module => ({ default: module.NewArrivals }))
);
const OffSection = lazy(() => 
  import("@/components/shop").then(module => ({ default: module.OffSection }))
);
const BestSellers = lazy(() => 
  import("@/components/shop").then(module => ({ default: module.BestSellers }))
);
const Reviews = lazy(() => 
  import("@/components/shop").then(module => ({ default: module.Reviews }))
);

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const categoryRef = useRef<HTMLDivElement>(null);
  const newArrivalsRef = useRef<HTMLDivElement>(null);
  const offSectionRef = useRef<HTMLDivElement>(null);
  const bestSellersRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle hash navigation on page load
    const hash = window.location.hash;
    if (hash) {
      const sectionId = hash.substring(1); // Remove the #
      const element = document.getElementById(sectionId);
      if (element) {
        // Wait for page to fully load
        setTimeout(() => {
          const headerHeight = 80; // Height of fixed header
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    // Set up GSAP animations for smooth section transitions
    // Note: NewArrivals, OffSection, BestSellers, and Reviews handle their own animations internally
    const ctx = gsap.context(() => {
      // Only animate CategorySection at page level
      if (categoryRef.current) {
        gsap.fromTo(
          categoryRef.current,
          {
            y: 60,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: categoryRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // Refresh ScrollTrigger after animations are set up
      ScrollTrigger.refresh();
    });

    // Cleanup
    return () => {
      ctx.revert();
    };
  }, []);

  // Loading fallback component
  const SectionLoader = () => (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="medium" />
    </div>
  );

  return (
    <div className="w-full">
      <Hero />
      <div ref={categoryRef}>
        <Suspense fallback={<SectionLoader />}>
          <CategorySection />
        </Suspense>
      </div>
      <div ref={newArrivalsRef}>
        <Suspense fallback={<SectionLoader />}>
          <NewArrivals />
        </Suspense>
      </div>
      <div ref={offSectionRef}>
        <Suspense fallback={<SectionLoader />}>
          <OffSection />
        </Suspense>
      </div>
      <div ref={bestSellersRef}>
        <Suspense fallback={<SectionLoader />}>
          <BestSellers />
        </Suspense>
      </div>
      <div ref={reviewsRef}>
        <Suspense fallback={<SectionLoader />}>
          <Reviews />
        </Suspense>
      </div>
    </div>
  );
}
