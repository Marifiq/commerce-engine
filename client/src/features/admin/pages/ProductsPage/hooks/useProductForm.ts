/**
 * Hook for managing product form state
 */

import { useState } from 'react';
import { Product } from '@/types/product';
import { apiFetch } from '@/lib/utils/api';
import { resolveImageUrl } from '@/lib/utils/imageUtils';

export interface MediaItem {
  id: string;
  file?: File;
  preview: string;
  originalUrl?: string;
  type: 'image' | 'video';
  isPrimary: boolean;
  order: number;
}

export interface ProductFormData {
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  stock: number;
  discountPercent: number;
  sizeEnabled: boolean;
}

export function useProductForm() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    category: '',
    description: '',
    image: '/images/placeholder.jpg',
    stock: 0,
    discountPercent: 0,
    sizeEnabled: false,
  });
  const [productSizes, setProductSizes] = useState<Array<{ size: string; stock: number }>>([]);
  const [newSize, setNewSize] = useState({ size: '', stock: 0 });
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const initializeForm = async (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description || '',
        image: product.image,
        stock: product.stock || 0,
        discountPercent: product.discountPercent || 0,
        sizeEnabled: product.sizeEnabled || false,
      });

      // Load sizes if sizeEnabled
      if (product.sizeEnabled && product.id) {
        try {
          const sizesRes = await apiFetch(`/products/${product.id}/sizes`);
          setProductSizes(sizesRes.data.sizes || []);
        } catch (error) {
          console.error('Failed to load sizes:', error);
          setProductSizes([]);
        }
      } else {
        setProductSizes([]);
      }

      // Load existing media
      if (product.media && product.media.length > 0) {
        const existingMedia: MediaItem[] = product.media.map((m, index) => ({
          id: `existing-${m.id}`,
          preview: resolveImageUrl(m.url),
          originalUrl: m.url,
          type: m.type as 'image' | 'video',
          isPrimary: m.isPrimary,
          order: m.order,
        }));
        setMediaItems(existingMedia);
      } else {
        setMediaItems([
          {
            id: 'existing-main',
            preview: resolveImageUrl(product.image),
            originalUrl: product.image,
            type: 'image',
            isPrimary: true,
            order: 0,
          },
        ]);
      }
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: 0,
        category: '',
        description: '',
        image: '/images/placeholder.jpg',
        stock: 0,
        discountPercent: 0,
        sizeEnabled: false,
      });
      setMediaItems([]);
      setProductSizes([]);
      setNewSize({ size: '', stock: 0 });
    }
  };

  const resetForm = () => {
    initializeForm(null);
  };

  return {
    formData,
    setFormData,
    productSizes,
    setProductSizes,
    newSize,
    setNewSize,
    mediaItems,
    setMediaItems,
    editingProduct,
    initializeForm,
    resetForm,
  };
}

