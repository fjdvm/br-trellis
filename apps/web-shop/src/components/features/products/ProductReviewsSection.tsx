"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Star, MessageSquare, Loader2, CheckCircle2, Lock } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";

interface ProductReviewsSectionProps {
  productId: string;
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const {
    reviews,
    averageRating,
    reviewCount,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    hasUserReviewed,
    isAuthenticated,
    submitReview,
  } = useReviews(productId);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || rating < 1 || rating > 5 || comment.length > 500) return;

    const ok = await submitReview(rating, comment.trim());
    if (ok) {
      setComment("");
    }
  };

  return (
    <section className="mt-16 border-t border-outline-variant/30 pt-12 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="headline-md font-serif text-primary flex items-center gap-2">
            <MessageSquare className="w-6 h-6" /> Customer Reviews & Ratings
          </h2>
          <p className="body-md text-on-surface-variant mt-1">
            Real feedback from verified purchasers
          </p>
        </div>

        {/* Summary Rating Badge */}
        <div className="flex items-center gap-3 bg-secondary-container/40 border border-outline-variant/30 px-5 py-3 rounded-2xl">
          <div className="flex items-center text-primary">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(averageRating)
                    ? "fill-primary text-primary"
                    : "text-outline-variant"
                }`}
              />
            ))}
          </div>
          <div>
            <span className="text-lg font-bold text-primary">
              {averageRating > 0 ? averageRating : "No ratings"}
            </span>
            <span className="text-xs text-on-surface-variant font-medium ml-1">
              ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Review Form */}
        <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-2xs">
          <h3 className="font-serif font-bold text-lg text-on-surface mb-4">Write a Review</h3>

          {!isAuthenticated ? (
            <div className="text-center py-6 bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5">
              <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs text-on-surface-variant font-medium mb-4">
                You must be logged in to leave feedback or rate this product.
              </p>
              <Link
                href="/signin"
                className="inline-block w-full py-3 bg-primary text-on-primary text-xs font-semibold rounded-full hover:bg-primary-container transition-all"
              >
                Sign In to Review
              </Link>
            </div>
          ) : hasUserReviewed ? (
            <div className="p-5 bg-secondary-container/40 border border-outline-variant/30 rounded-2xl text-center">
              <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs font-bold text-on-surface">Thank you for your feedback!</p>
              <p className="text-xs text-on-surface-variant mt-1">
                You have already submitted a review for this product.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs text-on-error-container bg-error-container border border-error/20 rounded-2xl">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="p-3 text-xs text-on-primary-container bg-primary-container/20 border border-primary/20 rounded-2xl">
                  {successMessage}
                </div>
              )}

              {/* Interactive Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  Your Rating (1 to 5 stars)
                </label>
                <div className="flex items-center gap-1 text-primary cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating || rating)
                            ? "fill-primary text-primary"
                            : "text-outline-variant"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-on-surface">
                    {hoverRating || rating} / 5
                  </span>
                </div>
              </div>

              {/* Feedback Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-on-surface">Feedback</label>
                  <span
                    className={`text-[10px] font-semibold ${
                      comment.length > 500 ? "text-error" : "text-on-surface-variant"
                    }`}
                  >
                    {comment.length} / 500
                  </span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Share your thoughts about this product's taste, quality, packaging..."
                  className="w-full p-4 text-xs border border-outline-variant/40 rounded-2xl bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!comment.trim() || isSubmitting || comment.length > 500}
                className="w-full py-3 bg-primary text-on-primary text-xs font-semibold rounded-full hover:bg-primary-container transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Submit Feedback & Rating"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Reviews List */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-serif font-bold text-lg text-on-surface">
            Reviews ({reviewCount})
          </h3>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-on-surface-variant font-medium">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-low border border-outline-variant/30 rounded-3xl text-on-surface-variant text-xs">
              No reviews yet for this product. Be the first to leave feedback!
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="p-5 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xs space-y-2"
              >
                {/* Rating Stars & Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-primary">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? "fill-primary text-primary"
                            : "text-outline-variant"
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-[11px] text-on-surface-variant font-medium">
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Feedback Comment */}
                <p className="text-xs text-on-surface leading-relaxed font-normal whitespace-pre-wrap break-words">
                  {review.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
