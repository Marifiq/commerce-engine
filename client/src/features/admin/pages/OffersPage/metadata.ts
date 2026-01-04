/**
 * SEO metadata for admin offers page
 */

import { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

export const adminOffersMetadata: Metadata = {
  title: `Offers Management | Admin | ${siteConfig.seo.siteName}`,
  description: 'Create and manage special offers and discounts.',
  robots: {
    index: false,
    follow: false,
  },
};

