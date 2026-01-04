'use client';

import { Modal } from '@/components/ui';

interface DeleteProductModalProps {
  isOpen: boolean;
  productId: number | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteProductModal({
  isOpen,
  productId,
  onClose,
  onConfirm,
}: DeleteProductModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Product"
      message="Are you sure you want to delete this product? This action cannot be undone and will remove the product from the store permanently."
      confirmText="Delete Product"
      type="danger"
    />
  );
}

