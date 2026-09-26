import { Star } from "lucide-react";

export function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex text-accent" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i + 1 <= Math.round(rating);
          return <Star key={i} className="h-4 w-4" fill={filled ? "currentColor" : "none"} strokeWidth={filled ? 0 : 1.5} />;
        })}
      </span>
      <span className="text-sm font-semibold text-ink tabular-nums">{rating.toFixed(1)}</span>
      <span className="text-sm text-link">
        ({reviewCount.toLocaleString()} {reviewCount === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}
