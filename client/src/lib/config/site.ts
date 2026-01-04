/**
 * Centralized site configuration
 * All static UI content that's not fetched from the server
 */

export const siteConfig = {
  // Brand Information
  brand: {
    name: '0x0ero',
    domain: '0x0ero.ic',
    fullName: '0x0ero.ic',
    displayName: '0x0ero.ic',
    tagline: 'Premium Shirts',
  },

  // SEO Metadata
  seo: {
    defaultTitle: 'ShirtStore - Premium Shirts',
    defaultDescription: 'Shop the best shirts online.',
    siteName: 'ShirtStore',
  },

  // Hero Section
  hero: {
    title: {
      line1: 'STYLE MEETS',
      line2: 'SUBSTANCE',
      highlight: 'SUBSTANCE',
    },
    subtitle: 'Premium quality shirts that blend comfort, durability, and timeless style. Find your perfect fit.',
    buttons: {
      primary: {
        text: 'Shop Now',
        href: '/shop',
      },
      secondary: {
        text: 'Offers',
        href: '/shop?off=true',
      },
    },
  },

  // Header Navigation
  header: {
    logo: {
      text: '0x0ero',
      suffix: '.ic',
    },
    navigation: [
      { label: 'Category', href: '/shop', type: 'link' },
      { label: 'Off', href: '#off', type: 'anchor' },
      { label: 'New Arrivals', href: '#new-arrivals', type: 'anchor' },
      { label: 'Best Sellers', href: '#best-sellers', type: 'anchor' },
    ],
    buttons: {
      adminPanel: 'Admin Panel',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      myOrders: 'My Orders',
      logout: 'Logout',
      search: 'Search',
      cart: 'Cart',
    },
  },

  // Footer
  footer: {
    brand: {
      name: '0x0ero',
      suffix: '.ic',
      description: 'Premium shirts for the modern individual. Quality fabrics, perfect fit, and timeless designs tailored for you.',
    },
    contact: {
      email: 'hello@0x0ero.ic',
      phone: '+1 (555) 123-4567',
      address: 'New York, NY',
    },
    social: {
      title: 'Follow Us',
      links: [
        { name: 'Instagram', href: '#', icon: 'instagram', color: 'hover:text-pink-500' },
        { name: 'Facebook', href: '#', icon: 'facebook', color: 'hover:text-blue-500' },
        { name: 'Twitter', href: '#', icon: 'twitter', color: 'hover:text-sky-400' },
        { name: 'LinkedIn', href: '#', icon: 'linkedin', color: 'hover:text-blue-600' },
      ],
    },
    quickLinks: {
      title: 'Shop',
      items: [
        { label: 'New Arrivals', href: '/new-arrivals' },
        { label: 'Men', href: '/men' },
        { label: 'Women', href: '/women' },
        { label: 'Accessories', href: '/accessories' },
        { label: 'Sale', href: '/sale' },
      ],
    },
    support: {
      title: 'Support',
      items: [
        { label: 'Contact Us', href: '#' },
        { label: 'Shipping Policy', href: '#' },
        { label: 'Returns & Exchanges', href: '#' },
        { label: 'Size Guide', href: '#' },
        { label: 'FAQs', href: '#' },
      ],
    },
    newsletter: {
      title: 'Newsletter',
      description: 'Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals delivered to your inbox.',
      placeholder: 'Enter your email',
      privacyNote: 'By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.',
    },
    bottomBar: {
      copyright: `© ${new Date().getFullYear()} 0x0ero.ic, Inc.`,
      madeWith: 'Made with',
      madeWithText: 'for style',
      policies: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
      ],
    },
  },

  // Common UI Text
  ui: {
    loading: 'Loading...',
    error: 'Something went wrong',
    noData: 'No data available',
    emptyState: {
      orders: {
        title: 'No orders yet',
        description: "You haven't placed any orders yet. Start shopping to fill your wardrobe.",
        action: 'Start Shopping',
      },
      products: {
        title: 'No products found',
        description: 'Try adjusting your filters or search terms.',
      },
    },
    buttons: {
      addToCart: 'Add to Cart',
      buyNow: 'Buy Now',
      viewDetails: 'View Details',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      submit: 'Submit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
    },
    messages: {
      addedToCart: 'Product added to cart',
      removedFromCart: 'Product removed from cart',
      orderPlaced: 'Order placed successfully',
      reviewSubmitted: 'Review submitted successfully',
      profileUpdated: 'Profile updated successfully',
    },
  },
} as const;

// Type exports for better type safety
export type SiteConfig = typeof siteConfig;

