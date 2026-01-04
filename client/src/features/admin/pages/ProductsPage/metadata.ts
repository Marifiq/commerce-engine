/**
 * SEO metadata for admin products page
 */

import { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

export const adminProductsMetadata: Metadata = {
  title: `Products Management | Admin | ${siteConfig.seo.siteName}`,
  description: 'Manage inventory and product details.',
  robots: {
    index: false,
    follow: false,
  },
};

