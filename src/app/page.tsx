import { CollectionTabs } from "@/components/collection-tabs";
import { HeroCarousel, type HeroSlide } from "@/components/hero-carousel";
import { ProductRail } from "@/components/product-rail";
import { Reveal } from "@/components/reveal";
import type { Category, Product } from "@/data/types";
import { getAllCategories } from "@/lib/categories";
import { getAllProducts } from "@/lib/products";

const HERO_SLIDES = 5;
/** Matches CollectionTabs' page size. */
const COLLECTION_PREVIEW = 8;
const PANELS = ["bg-brand", "bg-brand-secondary"];

/**
 * Products whose photos read well full-bleed in the hero, taking their
 * category's slot ahead of the automatic pick. Any slug that no longer
 * exists is simply skipped. (A "feature on homepage" switch in the admin
 * panel will replace this list.)
 */
const PREFERRED_HERO_SLUGS = ["stride-everyday-sneakers", "ironcore-hex-rubber-dumbbells"];

const isOnSale = (p: Product) => p.compareAtPrice !== undefined && p.compareAtPrice > p.price;

/** "Nova X 5G Smartphone, 6.1" OLED, Triple Camera" -> "Nova X 5G Smartphone". */
function shortTitle(title: string) {
  return title.split(/,| with | — |: | \(/)[0].trim();
}

function firstSentence(text: string) {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

/**
 * Hero slides come straight from the catalog — one product per category, so
 * the slideshow spans the store: preferred picks first, then real sales, then
 * anything else. Slides follow the store's category order.
 */
function buildHeroSlides(products: Product[], categories: Category[]): HeroSlide[] {
  const picked: Product[] = [];
  const usedCategories = new Set<string>();
  const preferred = PREFERRED_HERO_SLUGS.flatMap((slug) => products.filter((p) => p.slug === slug));
  for (const pool of [preferred, products.filter(isOnSale), products]) {
    for (const product of pool) {
      if (picked.length === HERO_SLIDES) break;
      if (usedCategories.has(product.categoryId) || picked.includes(product)) continue;
      picked.push(product);
      usedCategories.add(product.categoryId);
    }
  }
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const categoryOrder = new Map(categories.map((c, i) => [c.id, i]));
  picked.sort((a, b) => (categoryOrder.get(a.categoryId) ?? 0) - (categoryOrder.get(b.categoryId) ?? 0));

  return picked.map((product, i) => {
    const category = categoryById.get(product.categoryId);
    const sale = isOnSale(product);
    const saving = sale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;
    return {
      id: product.id,
      eyebrow: sale ? `On sale · Save ${saving}%` : `${category?.name ?? "Featured"} · ${product.brand}`,
      title: shortTitle(product.title),
      blurb: firstSentence(product.description),
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      href: `/products/${product.slug}`,
      image: product.images[0],
      categoryName: category?.name ?? "the store",
      categoryHref: category ? `/category/${category.slug}` : "/products",
      tint: PANELS[i % PANELS.length],
    };
  });
}

export default async function Home() {
  const [categories, products] = await Promise.all([getAllCategories(), getAllProducts()]);
  const slides = buildHeroSlides(products, categories);
  // "Explore the collection" opens on the first page of products, so the
  // drifting rail leads with the rest — no product appears twice in a row.
  const picks = [...products.slice(COLLECTION_PREVIEW), ...products.slice(0, COLLECTION_PREVIEW)].slice(0, 12);

  return (
    <main id="main-content" className="flex-1 pb-4">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
        <HeroCarousel slides={slides} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <ProductRail title="Worth a closer look" products={picks} href="/products" linkLabel="Shop everything" />
        </Reveal>

        <Reveal>
          <CollectionTabs categories={categories} products={products} />
        </Reveal>
      </div>
    </main>
  );
}
