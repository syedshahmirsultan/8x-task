import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { categories as mockCategories } from "../data/categories";
import { products as mockProducts } from "../data/products";
import { categories, productVariants, products } from "./schema";

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
  await db.insert(categories).values(mockCategories).onConflictDoNothing();

  console.log("Seeding products...");
  const productRows = mockProducts.map(({ variants, ...product }) => product);
  await db.insert(products).values(productRows).onConflictDoNothing();

  console.log("Seeding product variants...");
  const variantRows = mockProducts.flatMap((product) =>
    (product.variants ?? []).map((variant) => ({ ...variant, productId: product.id })),
  );
  if (variantRows.length > 0) {
    await db.insert(productVariants).values(variantRows).onConflictDoNothing();
  }

  console.log(
    `Done: ${mockCategories.length} categories, ${productRows.length} products, ${variantRows.length} variants.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
