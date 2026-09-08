import Image from "next/image";
import { Logo } from "@/components/logo";
import { getFeaturedProducts } from "@/lib/products";
import { formatPrice } from "@/lib/format";

// Temporary smoke-test page for Phase A (design tokens + mock data layer).
// Replaced by the real home page (hero, category rails) in a later phase.
export default function Home() {
  const products = getFeaturedProducts(8);

  return (
    <>
      <header className="bg-brand px-4 py-3">
        <Logo />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold">Featured products</h1>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li
              key={product.id}
              className="rounded-lg border border-border bg-white p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-background">
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-2 line-clamp-2 text-sm">{product.title}</p>
              <p className="mt-1 font-semibold text-price">
                {formatPrice(product.price)}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
