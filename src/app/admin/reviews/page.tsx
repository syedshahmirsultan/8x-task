import { AdminReviewRow } from "@/components/admin/admin-review-row";
import { getAllReviews } from "@/lib/reviews";

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();

  return (
    <div>
      <h1 className="text-xl font-semibold">Reviews</h1>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-white p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-500 uppercase">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">Author</th>
              <th className="pb-2 font-medium">Rating</th>
              <th className="pb-2 font-medium">Title</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <AdminReviewRow
                key={review.id}
                id={review.id}
                productTitle={review.productTitle}
                authorName={review.authorName}
                rating={review.rating}
                title={review.title}
              />
            ))}
          </tbody>
        </table>
        {reviews.length === 0 && <p className="py-4 text-sm text-gray-500">No reviews yet.</p>}
      </div>
    </div>
  );
}
