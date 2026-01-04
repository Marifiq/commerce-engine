/**
 * SEO metadata for admin users page
 */

import { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

export const adminUsersMetadata: Metadata = {
  title: `Users Management | Admin | ${siteConfig.seo.siteName}`,
  description: 'Manage permissions and accounts.',
  robots: {
    index: false,
    follow: false,
  },
};

