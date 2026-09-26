import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { ProductAiSummary } from "@/components/product-ai-summary";
import { ProductGallery } from "@/components/product-gallery";
import { ProductImageProvider } from "@/components/product-image-context";
import { ProductOptions } from "@/components/product-options";
import { ProductRail } from "@/components/product-rail";
import { ProductReviews } from "@/components/product-reviews";
import { StarRating } from "@/components/star-rating";
import { getCategoryById } from "@/lib/categories";
import { hasUserPurchasedProduct } from "@/lib/orders";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/products";
import { getReviewsByProductId, hasUserReviewedProduct, summarizeReviews } from "@/lib/reviews";

// Pre-render a page for every product known at build time; products added
// later from the admin panel render on first request.
export async function generateStaticParams() {
  const allProducts = await getAllProducts();
  return allProducts.map((product) => ({ slug: product.slug }));
}

/** Related products shown in the drifting rail — enough that it has room to move. */
const RELATED_COUNT = 10;

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const { userId } = await auth();
  const [sameCategory, allProducts, reviews, category] = await Promise.all([
    getRelatedProducts(product, RELATED_COUNT),
    getAllProducts(),
    getReviewsByProductId(product.id),
    getCategoryById(product.categoryId),
  ]);
  // Same-category picks first, topped up from the rest of the store.
  const related = [
    ...sameCategory,
    ...allProducts.filter((p) => p.id !== product.id && p.categoryId !== product.categoryId),
  ].slice(0, RELATED_COUNT);
  const { average, count } = summarizeReviews(reviews);
  // The product's own photos, then any version photos not already among them,
  // so every version can be seen (and picked) from the gallery.
  const galleryImages = [
    ...new Set([...product.images, ...(product.variants ?? []).flatMap((v) => (v.image ? [v.image] : []))]),
  ];

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
    <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 sm:px-6 sm:pt-6">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs text-ink-2">
        <Link href="/" className="shrink-0 transition-colors hover:text-ink">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        {category && (
          <>
            <Link href={`/category/${category.slug}`} className="shrink-0 transition-colors hover:text-ink">
              {category.name}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </>
        )}
        <span aria-current="page" className="truncate text-ink">
          {product.title}
        </span>
      </nav>

      <ProductImageProvider>
        <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
          <ProductGallery images={galleryImages} title={product.title} variants={product.variants} />

          <div className="min-w-0 lg:py-2">
            <Link
              href={`/search?q=${encodeURIComponent(product.brand)}`}
              className="text-sm font-medium text-link transition-colors hover:text-link-hover"
            >
              {product.brand}
            </Link>
            <h1 className="mt-1.5 text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.03em] text-ink [overflow-wrap:anywhere] sm:text-[2.1rem]">
              {product.title}
            </h1>
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm">
              {count > 0 ? (
                <StarRating rating={average} reviewCount={count} />
              ) : (
                <span className="text-ink-2">
                  No reviews yet · <span className="text-link">Be the first</span>
                </span>
              )}
            </a>

            <div className="mt-5">
              <ProductAiSummary slug={product.slug} reviewCount={count} />
            </div>

            <div className="mt-6">
              <ProductOptions product={product} />
            </div>
          </div>
        </div>
      </ProductImageProvider>

      <section aria-labelledby="details-heading" className="mt-16">
        <h2 id="details-heading" className="text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-[1.75rem]">
          About this product
        </h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/[0.05] sm:p-8">
            <p className="text-[0.95rem] leading-relaxed text-ink-2">{product.description}</p>
          </div>
          {product.bullets.length > 0 && (
            <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/[0.05] sm:p-8">
              <p className="text-sm font-semibold text-ink">Highlights</p>
              <ul className="mt-4 space-y-3">
                {product.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-strong">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

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

      <ProductRail
        title="You may also like"
        products={related}
        href={category ? `/category/${category.slug}` : "/products"}
        linkLabel={category ? `More in ${category.name}` : "Shop everything"}
      />
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
