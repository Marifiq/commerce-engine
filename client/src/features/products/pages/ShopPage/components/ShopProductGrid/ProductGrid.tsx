'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/shop';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProductGridProps {
  products: Product[];
  searchTerm: string;
}

export function ProductGrid({ products, searchTerm }: ProductGridProps) {
  const productsGridRef = useRef<HTMLDivElement>(null);

  // GSAP animations for product cards
  useEffect(() => {
    if (!productsGridRef.current) return;

    const ctx = gsap.context(() => {
      const cards = productsGridRef.current?.querySelectorAll('.product-card');
      if (!cards || cards.length === 0) return;

      // Reset initial state
      gsap.set(cards, {
        opacity: 0,
        y: 60,
        scale: 0.9,
      });

      // Animate cards in with stagger
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'power3.out',
        stagger: {
          amount: 0.8,
          from: 'start',
        },
        scrollTrigger: {
          trigger: productsGridRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    }, productsGridRef);

    return () => ctx.revert();
  }, [products, searchTerm]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={productsGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}

