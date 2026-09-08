import Image from "next/image";
import Link from "next/link";
import { ProductRail } from "@/components/product-rail";
import { getAllCategories } from "@/lib/categories";
import { getAllProducts, getFeaturedProducts } from "@/lib/products";

export default function Home() {
  const categories = getAllCategories();
  const deals = getAllProducts().filter(
    (p) => p.compareAtPrice !== undefined && p.compareAtPrice > p.price,
  );
  const featured = getFeaturedProducts(8);

  return (
    <main id="main-content" className="flex-1">
      <section className="bg-gradient-to-br from-brand to-brand-secondary px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Everything you need, delivered fast.
          </h1>
          <p className="mt-3 max-w-xl text-gray-200">
            Shop electronics, home goods, fashion, and more — all in one
            place.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block cursor-pointer rounded-md bg-accent-cart px-6 py-3 font-semibold text-brand transition-colors hover:bg-accent-cart-hover"
          >
            Shop now
          </Link>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h2 className="mb-3 text-lg font-semibold">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/category/${category.slug}`}
                className="group block cursor-pointer overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 16vw, 33vw"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                </div>
                <p className="p-2 text-center text-sm font-medium transition-colors group-hover:text-link">
                  {category.name}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <ProductRail title="Today's Deals" products={deals} />
        <ProductRail title="Top Picks for You" products={featured} />
      </div>
    </main>
  );
}
