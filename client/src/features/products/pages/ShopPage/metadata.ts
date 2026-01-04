/**
 * SEO metadata for shop page
 */

import { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

export const shopMetadata: Metadata = {
  title: `Shop | ${siteConfig.seo.siteName}`,
  description: 'Discover our premium collection of high-quality apparel and accessories. Browse by category, find the perfect fit, and shop the latest trends.',
  openGraph: {
    title: `Shop | ${siteConfig.seo.siteName}`,
    description: 'Discover our premium collection of high-quality apparel and accessories.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Shop | ${siteConfig.seo.siteName}`,
    description: 'Discover our premium collection of high-quality apparel and accessories.',
  },
};

