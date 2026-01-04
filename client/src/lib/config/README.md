# Site Configuration

This directory contains centralized configuration for all static UI content that's not fetched from the server.

## Overview

The `site.ts` file contains all static content including:
- Brand information (name, logo, tagline)
- SEO metadata defaults
- Hero section content
- Header navigation and buttons
- Footer content (links, contact info, social media)
- Common UI text (buttons, messages, empty states)

## Usage

### Import the config

```typescript
import { siteConfig } from '@/lib/config/site';
```

### Access configuration values

```typescript
// Brand name
siteConfig.brand.name // "0x0ero"
siteConfig.brand.fullName // "0x0ero.ic"

// Hero content
siteConfig.hero.title.line1 // "STYLE MEETS"
siteConfig.hero.title.line2 // "SUBSTANCE"
siteConfig.hero.subtitle // "Premium quality shirts..."

// Header navigation
siteConfig.header.navigation // Array of navigation items
siteConfig.header.buttons.signIn // "Sign In"

// Footer content
siteConfig.footer.contact.email // "hello@0x0ero.ic"
siteConfig.footer.social.links // Array of social media links

// Common UI text
siteConfig.ui.emptyState.orders.title // "No orders yet"
siteConfig.ui.buttons.addToCart // "Add to Cart"
```

## Updating Content

To update any static content:

1. Open `/src/lib/config/site.ts`
2. Find the relevant section (brand, hero, header, footer, ui)
3. Update the values
4. Save the file - changes will automatically reflect across all components

## Examples

### Change Brand Name

```typescript
export const siteConfig = {
  brand: {
    name: 'YourBrand', // Change this
    domain: 'yourbrand.com', // Change this
    // ...
  },
  // ...
};
```

### Update Hero Text

```typescript
hero: {
  title: {
    line1: 'YOUR NEW', // Change this
    line2: 'TAGLINE', // Change this
  },
  subtitle: 'Your new subtitle text here', // Change this
  // ...
},
```

### Add/Remove Navigation Items

```typescript
header: {
  navigation: [
    { label: 'Category', href: '/shop', type: 'link' },
    { label: 'New Item', href: '/new', type: 'link' }, // Add new item
    // ...
  ],
  // ...
},
```

### Update Footer Contact Info

```typescript
footer: {
  contact: {
    email: 'newemail@example.com', // Change this
    phone: '+1 (555) 999-9999', // Change this
    address: 'New Address, City', // Change this
  },
  // ...
},
```

### Update Social Media Links

```typescript
footer: {
  social: {
    links: [
      { name: 'Instagram', href: 'https://instagram.com/yourhandle', icon: 'instagram', color: 'hover:text-pink-500' },
      // Add or remove social links
    ],
  },
  // ...
},
```

## Components Using This Config

The following components have been updated to use the centralized config:

- ✅ `app/layout.tsx` - Root metadata
- ✅ `app/components/Header.tsx` - Logo, navigation, buttons
- ✅ `app/components/Footer.tsx` - All footer content
- ✅ `app/components/Hero.tsx` - Hero section text and buttons
- ✅ `app/(shop)/orders/page.tsx` - Empty state messages
- ✅ `features/products/pages/ShopPage/metadata.ts` - SEO metadata
- ✅ `features/orders/pages/OrdersPage/metadata.ts` - SEO metadata
- ✅ `features/products/pages/ProductPage/metadata.ts` - SEO metadata

## Benefits

1. **Single Source of Truth**: All static content is in one place
2. **Easy Updates**: Change content once, updates everywhere
3. **Type Safety**: TypeScript ensures correct usage
4. **Maintainability**: Easier to manage and update content
5. **Consistency**: Ensures consistent branding across the site

## Future Enhancements

Consider adding:
- Multi-language support
- Environment-specific configs (dev, staging, prod)
- Dynamic content loading from CMS
- A/B testing variants

