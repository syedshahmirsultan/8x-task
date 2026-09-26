"use client";

import { useState, type FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { BadgeCheck, MessageSquareText, PenLine, ShoppingCart, Star, X } from "lucide-react";
import { toast } from "sonner";
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

type SortKey = "newest" | "highest" | "lowest";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "highest", label: "Highest rated" },
  { key: "lowest", label: "Lowest rated" },
];
const RATING_WORDS = ["", "Not for me", "Could be better", "It's okay", "Really good", "Loved it"];

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="flex text-accent" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i + 1 <= Math.round(value);
        return <Star key={i} className={size} fill={filled ? "currentColor" : "none"} strokeWidth={filled ? 0 : 1.5} />;
      })}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1;
          const filled = starValue <= shown;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHover(starValue)}
              aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
              aria-pressed={value === starValue}
              className="cursor-pointer text-accent transition-transform duration-150 hover:scale-110"
            >
              <Star className="h-7 w-7" fill={filled ? "currentColor" : "none"} strokeWidth={filled ? 0 : 1.5} />
            </button>
          );
        })}
      </div>
      <span className="text-sm font-medium text-ink-2">{RATING_WORDS[shown]}</span>
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
  const [sort, setSort] = useState<SortKey>("newest");

  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
  const sorted = [...reviews].sort((a, b) =>
    sort === "highest"
      ? b.rating - a.rating
      : sort === "lowest"
        ? a.rating - b.rating
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  function handleWriteReviewClick() {
    if (canReview) setShowForm(true);
    else setShowEligibilityModal(true);
  }

  function handleAddToCart() {
    cart.addLineItem({ id: productId, productId, slug, title: productTitle, image: productImage, price: productPrice });
    toast("Added to cart", {
      icon: <ShoppingCart className="h-5 w-5 text-ink" />,
      description: productTitle,
    });
    setShowEligibilityModal(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (rating === 0 || !title.trim() || !body.trim()) {
      toast.error("Add a rating, a title and a few words.");
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
      setSort("newest");
      toast.success("Review posted", { description: "Thanks for sharing — it's live below." });
    } catch {
      toast.error("Couldn't submit your review — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="mt-16 scroll-mt-24">
      <h2 id="reviews-heading" className="text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-[1.75rem]">
        Customer reviews
      </h2>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-white p-6 ring-1 ring-ink/[0.05] lg:sticky lg:top-24">
          {count > 0 ? (
            <>
              <div className="flex items-end gap-3">
                <p className="text-5xl leading-none font-bold tracking-tight text-ink tabular-nums">
                  {average.toFixed(1)}
                </p>
                <div className="pb-1">
                  <Stars value={average} />
                  <p className="mt-1 text-xs text-ink-2">
                    Based on {count} {count === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-2">
                {distribution.map((row) => (
                  <li key={row.stars} className="flex items-center gap-3 text-xs text-ink-2 tabular-nums">
                    <span className="flex w-8 items-center gap-1">
                      {row.stars}
                      <Star className="h-3 w-3 text-accent" fill="currentColor" strokeWidth={0} />
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2">
                      <span
                        className="block h-full rounded-full bg-accent transition-[width] duration-700 ease-(--ease-out)"
                        style={{ width: `${count ? (row.count / count) * 100 : 0}%` }}
                      />
                    </span>
                    <span className="w-5 text-right">{row.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-paper-2">
                <MessageSquareText className="h-5 w-5 text-ink-2" />
              </span>
              <p className="mt-4 text-lg font-semibold text-ink">No reviews yet</p>
              <p className="mt-1 text-sm text-ink-2">Bought this? Be the first to say what you think.</p>
            </div>
          )}

          <div className="mt-6 border-t border-line pt-5">
            {alreadyReviewed ? (
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <BadgeCheck className="h-4 w-4 text-success" />
                You&apos;ve reviewed this — thank you!
              </p>
            ) : (
              <button
                type="button"
                onClick={handleWriteReviewClick}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-secondary-hover"
              >
                <PenLine className="h-4 w-4" />
                Write a review
              </button>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="animate-dropdown-in mb-5 space-y-4 rounded-3xl bg-white p-6 ring-1 ring-ink/[0.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-lg font-semibold text-ink">Share your thoughts</p>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label="Cancel review"
                  className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted hover:bg-paper-2 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <StarPicker value={rating} onChange={setRating} />
              <div>
                <label htmlFor="review-title" className="mb-1.5 block text-sm font-medium text-ink">
                  Title
                </label>
                <input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  placeholder="Sum it up in a few words"
                  className="h-11 w-full rounded-xl bg-paper-2 px-4 text-sm text-ink ring-accent placeholder:text-muted focus:ring-2 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="review-body" className="mb-1.5 block text-sm font-medium text-ink">
                  Review
                </label>
                <textarea
                  id="review-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="What did you like, and what could be better?"
                  className="w-full resize-none rounded-xl bg-paper-2 px-4 py-3 text-sm text-ink ring-accent placeholder:text-muted focus:ring-2 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="h-11 cursor-pointer rounded-full bg-accent-cart px-6 text-sm font-semibold text-ink transition-colors hover:bg-accent-cart-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Posting…" : "Post review"}
              </button>
            </form>
          )}

          {count > 1 && (
            <div role="group" aria-label="Sort reviews" className="mb-4 flex flex-wrap gap-2">
              {SORTS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSort(option.key)}
                  aria-pressed={sort === option.key}
                  className={`h-9 cursor-pointer rounded-full px-4 text-xs font-medium transition-colors ${
                    sort === option.key ? "bg-ink text-white" : "bg-white text-ink-2 ring-1 ring-ink/10 hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {count > 0 ? (
            <ul className="space-y-4">
              {sorted.map((review) => (
                <li key={review.id} className="animate-fade-in rounded-3xl bg-white p-6 ring-1 ring-ink/[0.05]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white uppercase">
                      {review.authorName.trim().charAt(0) || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{review.authorName}</p>
                      <p className="flex items-center gap-1 text-xs text-success">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified purchase
                      </p>
                    </div>
                    <time dateTime={review.createdAt} className="text-xs text-muted">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <div className="mt-4">
                    <Stars value={review.rating} />
                  </div>
                  <p className="mt-2 font-semibold text-ink">{review.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-ink-2">{review.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            !showForm && (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line px-6 py-10 text-center">
                <div className="flex gap-1 text-line-strong">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="h-6 w-6" fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <p className="mt-4 text-sm text-ink-2">Reviews from verified buyers will appear here.</p>
              </div>
            )
          )}
        </div>
      </div>

      {showEligibilityModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-eligibility-title"
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={() => setShowEligibilityModal(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowEligibilityModal(false)}
        >
          <div
            className="animate-dropdown-in w-full max-w-sm rounded-3xl bg-white p-6 text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-paper-2">
                <PenLine className="h-5 w-5 text-ink" />
              </span>
              <button
                type="button"
                onClick={() => setShowEligibilityModal(false)}
                aria-label="Close"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-paper-2 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 id="review-eligibility-title" className="mt-4 text-lg font-semibold text-ink">
              {isSignedIn ? "Order this to review it" : "Sign in to write a review"}
            </h2>
            <p className="mt-1.5 text-sm text-ink-2">
              {isSignedIn
                ? "Reviews come only from customers who bought the product, so every one is genuine."
                : "Reviews come only from signed-in customers who bought the product, so every one is genuine."}
            </p>
            <div className="mt-5 flex gap-2">
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  autoFocus
                  className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent-cart text-sm font-semibold text-ink transition-colors hover:bg-accent-cart-hover"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to cart
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  autoFocus
                  className="flex h-11 flex-1 items-center justify-center rounded-full bg-accent-cart text-sm font-semibold text-ink transition-colors hover:bg-accent-cart-hover"
                >
                  Sign in
                </Link>
              )}
              <button
                type="button"
                onClick={() => setShowEligibilityModal(false)}
                className="h-11 cursor-pointer rounded-full px-5 text-sm font-medium text-ink-2 ring-1 ring-ink/10 transition-colors hover:bg-paper-2"
              >
                Not now
              </button>
            </div>
            <p className="mt-4 text-xs text-muted">
              Already ordered it?{" "}
              <Link href="/account/orders" className="font-medium text-link hover:underline">
                Check your orders
              </Link>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
