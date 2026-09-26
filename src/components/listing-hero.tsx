import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Compact navy banner that opens every listing page — same voice as the home
 * hero, with a small fanned stack of real product photos from the page.
 */
export function ListingHero({
  title,
  description,
  images,
  breadcrumb,
}: {
  title: string;
  description: string;
  images: string[];
  /** Trail before the current page, e.g. [{ label: "All products", href: "/products" }]. */
  breadcrumb?: { label: string; href: string }[];
}) {
  const stack = images.slice(0, 3);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand px-6 py-8 text-white sm:px-10 sm:py-10">
      <div className="relative z-10 max-w-xl">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-white/60">
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          {breadcrumb?.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <Link href={crumb.href} className="transition-colors hover:text-white">
                {crumb.label}
              </Link>
            </span>
          ))}
          <ChevronRight className="h-3 w-3" />
          <span aria-current="page" className="text-white/90">
            {title}
          </span>
        </nav>
        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.03em] [overflow-wrap:anywhere] sm:text-[2.6rem]">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/70 sm:text-[0.95rem]">{description}</p>
      </div>

      {stack.length > 0 && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-6 hidden w-72 items-center md:flex lg:right-12">
          {stack.map((image, i) => (
            <span
              key={image}
              className="absolute h-32 w-32 overflow-hidden rounded-2xl bg-white shadow-[0_18px_36px_-18px_rgb(0_0_0/0.7)] ring-4 ring-brand lg:h-36 lg:w-36"
              style={{
                right: `${i * 4.25}rem`,
                transform: `rotate(${[6, -4, 3][i]}deg) translateY(${[0, 10, -6][i]}px)`,
                zIndex: stack.length - i,
              }}
            >
              <Image src={image} alt="" fill sizes="144px" className="object-cover" />
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
