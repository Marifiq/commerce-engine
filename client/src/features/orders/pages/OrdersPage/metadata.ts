/**
 * SEO metadata for orders page
 */

import { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

export const ordersMetadata: Metadata = {
  title: `My Orders | ${siteConfig.seo.siteName}`,
  description: 'View and manage your orders. Track shipments, reorder items, and leave reviews for your purchases.',
  openGraph: {
    title: `My Orders | ${siteConfig.seo.siteName}`,
    description: 'View and manage your orders. Track shipments and reorder items.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `My Orders | ${siteConfig.seo.siteName}`,
    description: 'View and manage your orders.',
  },
};

