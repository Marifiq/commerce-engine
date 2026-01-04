import { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

interface ProductLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

// Note: generateMetadata is disabled here because productService uses client-side APIs
// Metadata is handled client-side via structured data in the page component
export async function generateMetadata({ params }: ProductLayoutProps): Promise<Metadata> {
  const { id } = await params;
  // Return basic metadata - full metadata is handled client-side
  return {
    title: `Product | ${siteConfig.seo.siteName}`,
    description: 'View product details and add to cart.',
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

