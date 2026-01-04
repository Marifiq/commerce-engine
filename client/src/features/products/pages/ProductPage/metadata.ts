/**
 * SEO metadata generation for product pages
 */

import { Metadata } from 'next';
import { Product } from '@/types/product';
import { getApiBaseUrlWithoutVersion } from '@/lib/config/env';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import { siteConfig } from '@/lib/config/site';

export async function generateProductMetadata(product: Product): Promise<Metadata> {
  const imageUrl = product.image
    ? resolveImageUrl(product.image)
    : '/og-image.jpg';

  const description = product.description || 
    `Shop ${product.name} at ${siteConfig.seo.siteName}. ${product.category} collection. $${product.price.toFixed(2)}.`;

  return {
    title: `${product.name} | ${siteConfig.seo.siteName}`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: [imageUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [imageUrl],
    },
  };
}

/**
 * Generate structured data (JSON-LD) for product
 */
export function generateProductStructuredData(product: Product, baseUrl?: string) {
  const url = baseUrl || (typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'));
  
  const imageUrl = product.image
    ? resolveImageUrl(product.image)
    : '';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: imageUrl,
    brand: {
      '@type': 'Brand',
      name: siteConfig.seo.siteName,
    },
    offers: {
      '@type': 'Offer',
      url: `${url}/product/${product.id}`,
      priceCurrency: 'USD',
      price: product.discountedPrice || product.price,
      availability: product.stock > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: product.averageRating ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount || 0,
    } : undefined,
    category: product.category,
  };
}

