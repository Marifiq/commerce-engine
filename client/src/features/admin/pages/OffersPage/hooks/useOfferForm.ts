/**
 * Hook for managing offer form state
 */

import { useState } from 'react';
import { Offer } from '@/types/offer';

export interface OfferFormData {
  title: string;
  description: string;
  discountPercent: number;
  targetType: 'all' | 'product' | 'category';
  targetId: number | null;
  targetName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  showBanner: boolean;
}

export function useOfferForm() {
  const [formData, setFormData] = useState<OfferFormData>({
    title: '',
    description: '',
    discountPercent: 0,
    targetType: 'all',
    targetId: null,
    targetName: '',
    startDate: '',
    endDate: '',
    isActive: true,
    showBanner: false,
  });
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const initializeForm = (offer: Offer | null = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        title: offer.title,
        description: offer.description || '',
        discountPercent: offer.discountPercent,
        targetType: offer.targetType,
        targetId: offer.targetId || null,
        targetName: offer.targetName || '',
        startDate: offer.startDate
          ? new Date(offer.startDate).toISOString().slice(0, 16)
          : '',
        endDate: offer.endDate
          ? new Date(offer.endDate).toISOString().slice(0, 16)
          : '',
        isActive: offer.isActive,
        showBanner: offer.showBanner,
      });
      // Load selected products from offer
      if (offer.products && Array.isArray(offer.products)) {
        const productIds = offer.products.map((op: any) =>
          typeof op === 'object' && op.productId ? op.productId : op
        );
        setSelectedProductIds(productIds);
      } else {
        setSelectedProductIds([]);
      }
    } else {
      setEditingOffer(null);
      setFormData({
        title: '',
        description: '',
        discountPercent: 0,
        targetType: 'all',
        targetId: null,
        targetName: '',
        startDate: '',
        endDate: '',
        isActive: true,
        showBanner: false,
      });
      setSelectedProductIds([]);
    }
  };

  const resetForm = () => {
    initializeForm(null);
  };

  return {
    formData,
    setFormData,
    selectedProductIds,
    setSelectedProductIds,
    editingOffer,
    initializeForm,
    resetForm,
  };
}

