"use client";

import { useState, type FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ShoppingCart, Star, X } from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "@/components/star-rating";
import { useCart } from "@/lib/cart-context";

interface Review {
  id: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            className="cursor-pointer text-accent-buy"
          >
            <Star className="h-6 w-6" fill={filled ? "currentColor" : "none"} strokeWidth={filled ? 0 : 1.5} />
          </button>
        );
      })}
    </div>
  );
}

interface Props {
  slug: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  initialReviews: Review[];
  /**
   * Server-computed: only a signed-in buyer who hasn't already reviewed this
   * product yet. Reviewing is never offered before a purchase — even if the
   * button were somehow forced open, the API independently re-checks this.
   */
  initialCanReview: boolean;
  initialAlreadyReviewed: boolean;
}

export function ProductReviews({
  slug,
  productId,
  productTitle,
  productImage,
  productPrice,
  initialReviews,
  initialCanReview,
  initialAlreadyReviewed,
}: Props) {
  const { isSignedIn } = useUser();
  const cart = useCart();
  const [reviews, setReviews] = useState(initialReviews);
  const [canReview, setCanReview] = useState(initialCanReview);
  const [alreadyReviewed, setAlreadyReviewed] = useState(initialAlreadyReviewed);
  const [showForm, setShowForm] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  function handleWriteReviewClick() {
    if (canReview) {
      setShowForm(true);
    } else {
      setShowEligibilityModal(true);
    }
  }

  function handleAddToCart() {
    cart.addLineItem({
      id: productId,
      productId,
      slug,
      title: productTitle,
      image: productImage,
      price: productPrice,
    });
    toast.success(`Added ${productTitle} to your cart`);
    setShowEligibilityModal(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (rating === 0 || !title.trim() || !body.trim()) {
      toast.error("Please add a rating, title, and review.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't submit your review.");
        return;
      }
      setReviews((prev) => [data.review, ...prev]);
      setCanReview(false);
      setAlreadyReviewed(true);
      setShowForm(false);
      setRating(0);
      setTitle("");
      setBody("");
      toast.success("Thanks for your review!");
    } catch {
      toast.error("Couldn't submit your review — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" className="mt-10 scroll-mt-24 border-t border-border pt-8">
      <h2 className="text-lg font-semibold">Customer Reviews</h2>

      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No reviews yet — be the first to share your thoughts.</p>
      ) : (
        <div className="mt-3">
          <StarRating rating={average} reviewCount={reviews.length} />
        </div>
      )}

      {!alreadyReviewed && (
        <div className="mt-4">
          {!showForm ? (
            <button
              type="button"
              onClick={handleWriteReviewClick}
              className="cursor-pointer rounded-md bg-accent-buy px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-accent-buy-hover"
            >
              Write a review
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-lg space-y-3 rounded-lg border border-border p-4">
              <div>
                <p className="mb-1 text-sm font-medium">Your rating</p>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <label htmlFor="review-title" className="mb-1 block text-sm font-medium">
                  Title
                </label>
                <input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  className="input-field"
                  placeholder="Sum it up in a few words"
                />
              </div>
              <div>
                <label htmlFor="review-body" className="mb-1 block text-sm font-medium">
                  Review
                </label>
                <textarea
                  id="review-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="What did you like or dislike?"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer rounded-md bg-accent-cart px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-accent-cart-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit review"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-background"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {alreadyReviewed && (
        <p className="mt-4 text-sm text-gray-500">You&apos;ve already reviewed this product — thanks!</p>
      )}

      {reviews.length > 0 && (
        <ul className="mt-6 space-y-6">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-border pb-6 last:border-0">
              <div className="flex text-accent-buy">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    fill={i + 1 <= review.rating ? "currentColor" : "none"}
                    strokeWidth={i + 1 <= review.rating ? 0 : 1.5}
                  />
                ))}
              </div>
              <p className="mt-1 font-medium text-foreground">{review.title}</p>
              <p className="mt-1 text-sm text-gray-600">{review.body}</p>
              <p className="mt-2 text-xs text-gray-400">
                {review.authorName} ·{" "}
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}

      {showEligibilityModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-eligibility-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowEligibilityModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="review-eligibility-title" className="text-lg font-semibold">
                {isSignedIn ? "Order this product to review it" : "Sign in to write a review"}
              </h2>
              <button
                type="button"
                onClick={() => setShowEligibilityModal(false)}
                aria-label="Close"
                className="cursor-pointer rounded-md p-1 text-gray-400 transition-colors hover:bg-background hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {isSignedIn
                ? "Reviews are limited to customers who've purchased this product. Add it to your cart to get started."
                : "You'll need to sign in and purchase this product before you can leave a review."}
            </p>
            <div className="mt-4 flex gap-2">
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-accent-cart px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-accent-cart-hover"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  className="flex flex-1 cursor-pointer items-center justify-center rounded-md bg-accent-cart px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-accent-cart-hover"
                >
                  Sign in
                </Link>
              )}
              <button
                type="button"
                onClick={() => setShowEligibilityModal(false)}
                className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-background"
              >
                Not now
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Already ordered it?{" "}
              <Link href="/account/orders" className="text-link hover:underline">
                Check your orders
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
