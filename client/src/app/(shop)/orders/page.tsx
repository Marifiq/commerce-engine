"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { orderService } from "@/services/order.service";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { reviewService } from "@/services/review.service";
import { Review } from "@/types/review";
import { LoadingSpinner } from "@/components/ui";
import { ReviewModal, MediaViewer } from "@/components/modals";
import { Modal } from "@/components/ui";
import { useToast } from "@/contexts";
import {
  useOrders,
  useOrderActions,
} from "@/features/orders/pages/OrdersPage/hooks";
import { OrdersList } from "@/features/orders/pages/OrdersPage/components/OrdersList";
import { ReorderModal } from "@/features/orders/pages/OrdersPage/components/ReorderModal";
import { generateOrdersStructuredData } from "@/features/orders/pages/OrdersPage/structuredData";
import { siteConfig } from "@/lib/config/site";

export default function MyOrdersPage() {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { showToast } = useToast();
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [deleteReviewModal, setDeleteReviewModal] = useState<{
    isOpen: boolean;
    reviewId: number | null;
    productId: number | null;
  }>({ isOpen: false, reviewId: null, productId: null });
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
    image: string;
  } | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    media: string;
    type: "image" | "video";
  }>({
    isOpen: false,
    media: "",
    type: "image",
  });

  const [showArchived, setShowArchived] = useState(false);
  const { orders, loading, refetch } = useOrders(showArchived);
  const {
    reorderingOrderId,
    reorderResult,
    handleReorder,
    clearReorderResult,
  } = useOrderActions();

  // Generate structured data for SEO
  const ordersStructuredData =
    orders.length > 0 ? generateOrdersStructuredData(orders) : null;

  useEffect(() => {
    const fetchReviews = async () => {
      if (currentUser) {
        try {
          const reviews = await reviewService.getMyReviews();
          setUserReviews(reviews);
        } catch (error) {
          console.error("Failed to fetch reviews:", error);
          setUserReviews([]);
        }
      }
    };
    fetchReviews();
  }, [currentUser]);

  const handleWriteReview = (
    product: { id: number; name: string; image: string },
    existingReview?: Review
  ) => {
    setSelectedProduct(product);
    setEditingReview(existingReview || null);
    setIsReviewOpen(true);
  };

  const handleEditReview = (
    product: { id: number; name: string; image: string },
    review: Review
  ) => {
    handleWriteReview(product, review);
  };

  const handleDeleteReview = (reviewId: number, productId: number) => {
    setDeleteReviewModal({ isOpen: true, reviewId, productId });
  };

  const handleConfirmDeleteReview = async () => {
    if (!deleteReviewModal.reviewId || !deleteReviewModal.productId) return;

    const reviewId = deleteReviewModal.reviewId;

    setUserReviews((prevReviews) =>
      prevReviews.filter((r) => r.id !== reviewId)
    );
    setDeleteReviewModal({ isOpen: false, reviewId: null, productId: null });

    try {
      await reviewService.deleteReview(reviewId);
      if (currentUser) {
        const myReviews = await reviewService.getMyReviews();
        setUserReviews(myReviews);
      }
      showToast("Review deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete review", error);
      if (currentUser) {
        try {
          const myReviews = await reviewService.getMyReviews();
          setUserReviews(myReviews);
        } catch (refreshError) {
          console.error(
            "Failed to refresh reviews after delete error",
            refreshError
          );
        }
      }
      showToast("Failed to delete review. Please try again.", "error");
    }
  };

  const handleMediaClick = (media: string) => {
    const type =
      media.startsWith("data:video/") || media.toLowerCase().endsWith(".mp4")
        ? "video"
        : "image";
    setViewerState({
      isOpen: true,
      media,
      type: type as "image" | "video",
    });
  };

  const handleReviewSubmit = async (reviewData: {
    rating: number;
    text: string;
    images?: string[];
    videos?: string[];
  }) => {
    if (!selectedProduct) return;

    try {
      if (editingReview) {
        await reviewService.updateReview(editingReview.id, reviewData);
      } else {
        await reviewService.createReview({
          ...reviewData,
          productId: selectedProduct.id,
        });
      }

      if (currentUser) {
        const myReviews = await reviewService.getMyReviews();
        setUserReviews(myReviews);
      }
      setIsReviewOpen(false);
      setEditingReview(null);
      setSelectedProduct(null);
      showToast(
        editingReview
          ? "Review updated successfully!"
          : "Review submitted successfully!",
        "success"
      );
    } catch (error: unknown) {
      console.error("Failed to submit review", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit review. Please try again.";
      showToast(errorMessage, "error");
      throw error;
    }
  };

  const handleCloseModal = () => {
    setIsReviewOpen(false);
    setEditingReview(null);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-black px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-zinc-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
            {siteConfig.ui.emptyState.orders.title}
          </h2>
          <p className="text-zinc-500 mb-8">
            {siteConfig.ui.emptyState.orders.description}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-black px-8 py-3 text-base font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all"
          >
            {siteConfig.ui.emptyState.orders.action}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      {ordersStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ordersStructuredData),
          }}
        />
      )}

      <div className="min-h-screen bg-black pb-24">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              My Orders
            </h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <input
                type="checkbox"
                id="showArchivedOrders"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-black dark:text-white focus:ring-0 cursor-pointer"
              />
              <label htmlFor="showArchivedOrders" className="text-sm font-medium text-zinc-900 dark:text-white cursor-pointer whitespace-nowrap">
                Show Archived
              </label>
            </div>
          </div>

          <OrdersList
            orders={orders}
            reorderingOrderId={reorderingOrderId}
            onReorder={handleReorder}
            onWriteReview={handleWriteReview}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
            onMediaClick={handleMediaClick}
            userReviews={userReviews}
            showArchived={showArchived}
            onArchive={async (orderId: number) => {
              try {
                await orderService.archiveOrder(orderId);
                showToast("Order archived successfully", "success");
                await refetch();
              } catch (error) {
                console.error("Failed to archive order:", error);
                showToast("Failed to archive order", "error");
              }
            }}
            onUnarchive={async (orderId: number) => {
              try {
                await orderService.unarchiveOrder(orderId);
                showToast("Order unarchived successfully", "success");
                await refetch();
              } catch (error) {
                console.error("Failed to unarchive order:", error);
                showToast("Failed to unarchive order", "error");
              }
            }}
          />
        </div>

        {selectedProduct && (
          <ReviewModal
            isOpen={isReviewOpen}
            onClose={handleCloseModal}
            onSubmit={handleReviewSubmit}
            productName={selectedProduct.name}
            productImage={selectedProduct.image}
            existingReview={
              editingReview
                ? {
                    id: editingReview.id,
                    rating: editingReview.rating,
                    text: editingReview.text,
                    images: editingReview.images,
                    videos: editingReview.videos,
                  }
                : null
            }
          />
        )}

        <MediaViewer
          isOpen={viewerState.isOpen}
          onClose={() => setViewerState((prev) => ({ ...prev, isOpen: false }))}
          media={viewerState.media}
          mediaType={viewerState.type}
        />

        <Modal
          isOpen={deleteReviewModal.isOpen}
          onClose={() =>
            setDeleteReviewModal({
              isOpen: false,
              reviewId: null,
              productId: null,
            })
          }
          onConfirm={handleConfirmDeleteReview}
          title="Delete Review"
          message="Are you sure you want to delete this review? This action cannot be undone."
          confirmText="Delete Review"
          cancelText="Cancel"
          type="danger"
        />

        {reorderResult && (
          <ReorderModal
            isOpen={!!reorderResult}
            result={reorderResult}
            onClose={clearReorderResult}
          />
        )}
      </div>
    </>
  );
}
