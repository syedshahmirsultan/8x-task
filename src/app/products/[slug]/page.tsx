import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { ProductOptions } from "@/components/product-options";
import { ProductRail } from "@/components/product-rail";
import { StarRating } from "@/components/star-rating";
import { getCategoryById } from "@/lib/categories";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/products";

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

  const related = await getRelatedProducts(product);

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,3fr)_minmax(0,2fr)]">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <p className="text-sm text-link hover:underline">{product.brand}</p>
          <h1 className="mt-1 text-xl font-semibold">{product.title}</h1>
          <div className="mt-2">
            <StarRating rating={product.rating} reviewCount={product.reviewCount} />
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
