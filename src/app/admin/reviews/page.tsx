import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminReviewRow } from "@/components/admin/admin-review-row";
import { getAllReviews } from "@/lib/reviews";

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        description={
          reviews.length
            ? `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"} from verified buyers, newest first.`
            : "Reviews from verified buyers will appear here."
        }
      />
      {reviews.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {reviews.map((review) => (
            <AdminReviewRow
              key={review.id}
              id={review.id}
              productTitle={review.productTitle}
              productSlug={review.productSlug}
              authorName={review.authorName}
              rating={review.rating}
              title={review.title}
              body={review.body}
              createdAt={review.createdAt}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-3xl border-2 border-dashed border-line px-6 py-12 text-center text-sm text-ink-2">
          No reviews yet.
        </p>
      )}
    </div>
  );
}
