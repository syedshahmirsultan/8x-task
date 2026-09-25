import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { catalog, catalogCategories } from "./catalog";
import { categories, productVariants, products } from "./schema";

// Sets up a fresh database with the starting catalog. Safe to re-run:
// existing rows are left alone (onConflictDoNothing), so it never overwrites
// edits made in the admin panel.
//
// Standalone connection rather than importing ./index — that module is
// guarded by `server-only`, which throws outside Next.js's server runtime
// (this script runs under plain tsx/Node).
config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — check .env.local");
}
const db = drizzle(neon(process.env.DATABASE_URL), { casing: "snake_case" });

async function main() {
  console.log("Seeding categories...");
  await db.insert(categories).values(catalogCategories).onConflictDoNothing();

  console.log("Seeding products...");
  const productRows = catalog.map((p) => ({
    id: `p-${p.slug}`,
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    categoryId: p.categoryId,
    // Cards show the product price, so use the first (default) version's.
    price: p.variants[0].price,
    compareAtPrice: p.compareAtPrice ?? null,
    images: p.variants.map((v) => v.image),
    description: p.description,
    bullets: p.bullets,
    rating: 0,
    reviewCount: 0,
    stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
  }));
  await db.insert(products).values(productRows).onConflictDoNothing();

  console.log("Seeding product versions...");
  const variantRows = catalog.flatMap((p) =>
    p.variants.map((v, i) => ({
      id: `v-${p.slug}-${i + 1}`,
      productId: `p-${p.slug}`,
      label: v.label,
      options: { option: v.label },
      price: v.price,
      stock: v.stock,
      image: v.image,
      sortOrder: i,
    })),
  );
  await db.insert(productVariants).values(variantRows).onConflictDoNothing();

  console.log(
    `Done: ${catalogCategories.length} categories, ${productRows.length} products, ${variantRows.length} versions.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
