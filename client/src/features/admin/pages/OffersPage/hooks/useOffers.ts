/**
 * Hook for fetching and managing offers
 */

import { useState, useEffect } from 'react';
import { Offer } from '@/types/offer';
import { apiFetch } from '@/lib/utils/api';
import { useToast } from '@/contexts';

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchOffers = async () => {
    try {
      const res = await apiFetch('/offers');
      setOffers(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      showToast('Failed to load offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  return {
    offers,
    loading,
    refetch: fetchOffers,
  };
}

