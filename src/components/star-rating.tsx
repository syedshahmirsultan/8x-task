import { Star } from "lucide-react";

export function StarRating({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${rating} out of 5 stars`}>
      <div className="flex text-accent-buy">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i + 1 <= Math.round(rating);
          return (
            <Star
              key={i}
              className="h-4 w-4"
              fill={filled ? "currentColor" : "none"}
              strokeWidth={filled ? 0 : 1.5}
            />
          );
        })}
      </div>
      <span className="text-sm text-link hover:underline">{reviewCount.toLocaleString()} ratings</span>
    </div>
  );
}
