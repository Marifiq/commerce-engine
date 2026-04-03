'use client';

import Link from 'next/link';
import { Star, Edit2, Trash2, Film, ExternalLink } from 'lucide-react';
import { Order } from '@/types/order';
import { Review } from '@/types/review';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import { ReviewManagement } from '../ReviewManagement/ReviewManagement';

interface OrderItemsProps {
  order: Order;
  getProductReview: (productId: number) => Review | undefined;
  onWriteReview: (product: { id: number; name: string; image: string }) => void;
  onEditReview: (product: { id: number; name: string; image: string }, review: Review) => void;
  onDeleteReview: (reviewId: number, productId: number) => void;
  onMediaClick: (media: string) => void;
}

export function OrderItems({
  order,
  getProductReview,
  onWriteReview,
  onEditReview,
  onDeleteReview,
  onMediaClick,
}: OrderItemsProps) {
  return (
    <div className="flow-root">
      <ul className="-my-6 divide-y divide-zinc-100 dark:divide-zinc-800">
        {order.items.map((item) => {
          const review = getProductReview(item.productId);
          return (
            <li key={item.id} className="py-6">
              <div className="flex">
                <Link
                  href={`/product/${item.productId}`}
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                >
                  <img
                    src={resolveImageUrl(item.product?.image || '') || '/images/placeholder.jpg'}
                    alt={item.product?.name}
                    className="h-full w-full object-cover object-center"
                  />
                </Link>
                <div className="ml-4 flex flex-1 flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-zinc-900 dark:text-white">
                      <h3>
                        <Link
                          href={`/product/${item.productId}`}
                          className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                        >
                          {item.product?.name}
                        </Link>
                      </h3>
                      <p className="ml-4">${item.price || item.product?.price || 0}</p>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{item.product?.category}</p>
                  </div>
                  <div className="flex flex-1 items-end justify-between text-sm">
                    <p className="text-zinc-500">Qty {item.quantity}</p>
                    {(order.status || 'pending') === 'delivered' && !review && (
                      <button
                        onClick={() =>
                          onWriteReview({
                            id: item.productId,
                            name: item.product?.name || '',
                            image: item.product?.image || '',
                          })
                        }
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200 cursor-pointer"
                      >
                        Write a Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {review && (
                <ReviewManagement
                  review={review}
                  productId={item.productId}
                  productName={item.product?.name || ''}
                  productImage={item.product?.image || ''}
                  onEdit={() =>
                    onEditReview(
                      {
                        id: item.productId,
                        name: item.product?.name || '',
                        image: item.product?.image || '',
                      },
                      review
                    )
                  }
                  onDelete={() => onDeleteReview(review.id, item.productId)}
                  onMediaClick={onMediaClick}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

