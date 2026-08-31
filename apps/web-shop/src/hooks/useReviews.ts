"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { reviewsApi, type ReviewResponse } from "@/lib/api/reviews-api";

export function useReviews(productId: string) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const userId = session?.user?.id;

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reviewsApi.getByProduct(productId);
      setReviews(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (rating: number, comment: string) => {
    if (!token) {
      setError("Please sign in to submit a review.");
      return false;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      const newReview = await reviewsApi.createReview({ productId, rating, comment }, token);
      setReviews((prev) => [newReview, ...prev]);
      setSuccessMessage("Thank you! Your feedback and rating have been posted.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

  const hasUserReviewed = userId ? reviews.some((r) => r.userId === userId) : false;

  return {
    reviews,
    averageRating,
    reviewCount: reviews.length,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    hasUserReviewed,
    isAuthenticated: Boolean(token),
    submitReview,
  };
}
