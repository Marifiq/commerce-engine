import { notFound } from "next/navigation";
import Link from "next/link";
import { productServiceServer } from "@/services/productService.server";
import { reviewServiceServer } from "@/services/reviewService.server";
import { generateProductStructuredData } from "@/features/products/pages/ProductPage/metadata";
import { ProductPageClient } from "./ProductPageClient";
import { LoadingSpinner } from "@/components/ui";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  
  try {
    const product = await productServiceServer.getProduct(id);
    
    return {
      title: `${product.name} | ${product.category}`,
      description: product.description || `Buy ${product.name} - ${product.category}`,
      openGraph: {
        title: product.name,
        description: product.description || `Buy ${product.name}`,
        images: product.media?.filter(m => m.type === 'image').map(m => m.url) || [],
      },
    };
  } catch {
    return {
      title: "Product Not Found",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  try {
    // Fetch product and reviews in parallel on the server
    const [product, reviews] = await Promise.all([
      productServiceServer.getProduct(id),
      reviewServiceServer.getProductReviews(id),
    ]);

    // Generate structured data for SEO
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000');
    const structuredData = generateProductStructuredData(product, baseUrl);

    return (
      <>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ProductPageClient product={product} reviews={reviews} />
      </>
    );
  } catch (error) {
    // If product not found, show 404
    notFound();
  }
}
