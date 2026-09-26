import { randomUUID } from "crypto";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Category } from "@/data/types";

export async function getAllCategories(): Promise<Category[]> {
  return db.select().from(categories);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug));
  return row;
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const [row] = await db.select().from(categories).where(eq(categories.id, id));
  return row;
}

export async function getCategoryProductCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({ categoryId: products.categoryId, count: count() })
    .from(products)
    .groupBy(products.categoryId);
  return new Map(rows.map((row) => [row.categoryId, row.count]));
}

export async function isCategorySlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(exceptId ? and(eq(categories.slug, slug), ne(categories.id, exceptId)) : eq(categories.slug, slug));
  return Boolean(row);
}

export async function createCategory(input: Omit<Category, "id">): Promise<string> {
  // Seeded categories use their slug as the id; new ones do too, so ids stay readable.
  // The slug is checked unique first, but an old category may already hold this id.
  const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, input.slug));
  const id = existing ? `${input.slug}-${randomUUID().slice(0, 8)}` : input.slug;
  await db.insert(categories).values({ id, ...input });
  return id;
}

export async function updateCategory(id: string, input: Omit<Category, "id">): Promise<void> {
  await db.update(categories).set(input).where(eq(categories.id, id));
}
