import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ProductAiSummary } from "@/components/product-ai-summary";
import { ProductGallery } from "@/components/product-gallery";
import { ProductOptions } from "@/components/product-options";
import { ProductRail } from "@/components/product-rail";
import { ProductReviews } from "@/components/product-reviews";
import { StarRating } from "@/components/star-rating";
import { getCategoryById } from "@/lib/categories";
import { hasUserPurchasedProduct } from "@/lib/orders";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/products";
import { getReviewsByProductId, hasUserReviewedProduct, summarizeReviews } from "@/lib/reviews";

// Product slugs are known upfront from the mock data, so every PDP is
// generated statically at build time instead of rendered per request.
export async function generateStaticParams() {
  const allProducts = await getAllProducts();
  return allProducts.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const { userId } = await auth();
  const [related, reviews] = await Promise.all([
    getRelatedProducts(product),
    getReviewsByProductId(product.id),
  ]);
  const { average, count } = summarizeReviews(reviews);

  let canReview = false;
  let alreadyReviewed = false;
  if (userId) {
    const [purchased, reviewed] = await Promise.all([
      hasUserPurchasedProduct(userId, product.id),
      hasUserReviewedProduct(product.id, userId),
    ]);
    alreadyReviewed = reviewed;
    canReview = purchased && !reviewed;
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <ProductAiSummary slug={product.slug} />

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,3fr)_minmax(0,2fr)]">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <p className="text-sm text-link hover:underline">{product.brand}</p>
          <h1 className="mt-1 text-xl font-semibold">{product.title}</h1>
          <div className="mt-2">
            {count > 0 ? (
              <StarRating rating={average} reviewCount={count} />
            ) : (
              <p className="text-sm text-gray-500">No ratings yet</p>
            )}
          </div>

          <ul className="mt-4 list-inside list-disc space-y-1.5 text-sm text-foreground">
            {product.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>

          <p className="mt-4 text-sm text-gray-600">{product.description}</p>
        </div>

        <div className="rounded-lg border border-border bg-white p-4 lg:sticky lg:top-20 lg:h-fit">
          <ProductOptions product={product} />
        </div>
      </div>

      <ProductReviews
        slug={product.slug}
        productId={product.id}
        productTitle={product.title}
        productImage={product.images[0]}
        productPrice={product.price}
        initialReviews={reviews}
        initialCanReview={canReview}
        initialAlreadyReviewed={alreadyReviewed}
      />

      <ProductRail title="Related products" products={related} />
    </main>
  );
}

export async function generateMetadata(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const category = await getCategoryById(product.categoryId);
  return {
    title: `${product.title} | ${category?.name ?? "Kartify"}`,
    description: product.description,
  };
}
